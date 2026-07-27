import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule,
} from '@angular/forms';
import { TnFormFieldComponent, TnRadioComponent } from '@truenas/ui-components';
import { Option } from 'app/interfaces/option.interface';

/**
 * A `role="radiogroup"` wrapper around a set of `<tn-radio>`s.
 *
 * `tn-radio` is a per-option `ControlValueAccessor` with no group component of its own, so every
 * consumer that wants a radio group has to hand-roll one. This centralizes the two things that
 * are easy to get wrong when doing that:
 *
 * 1. **ARIA.** `tn-radio` does not consume the surrounding `tn-form-field`'s label context, so
 *    without an explicit `role="radiogroup"` and accessible name the options are announced
 *    ungrouped. The name is taken from an enclosing `tn-form-field`'s `label` when there is one;
 *    {@link ariaLabel} overrides it, and is required for a group with no visible label.
 * 2. **Reset staleness.** See {@link renderKey}.
 *
 * Bind it like any other control: `<ix-tn-radio-group formControlName="…">`.
 *
 * TEMP (NAS-141021): this component exists only because the library ships no radio-group.
 * Indexed in the tn-migration playbook's "Known upstream defects" table; retire it once
 * `@truenas/ui-components` provides one (or exposes `tn-radio`'s `checked` as an input).
 */
@Component({
  selector: 'ix-tn-radio-group',
  templateUrl: './tn-radio-group.component.html',
  styleUrls: ['./tn-radio-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnRadioComponent,
  ],
})
export class TnRadioGroupComponent implements ControlValueAccessor {
  private controlDirective = inject(NgControl);
  private destroyRef = inject(DestroyRef);
  private formField = inject(TnFormFieldComponent, { optional: true });

  readonly options = input<Option<unknown>[]>([]);

  /**
   * Accessible name for the group, overriding the enclosing `tn-form-field`'s label. Required
   * when there is no such field, or when it carries no label — a `radiogroup` with no name is
   * announced as an unlabeled group.
   */
  readonly ariaLabel = input<string>('');

  /**
   * Native `name` shared by every option's `<input type="radio">`, which is what makes the
   * browser treat them as one group for arrow-key navigation.
   */
  readonly name = input.required<string>();

  /**
   * Test-id base the option label is appended to, e.g. `['radio-button', 'encryption-type']`
   * resolves to `radio-button-encryption-type-<label>` per option.
   */
  readonly testId = input<string[]>([]);

  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() || this.formField?.label() || '');

  /**
   * Drives the `<tn-radio>` accessors. Kept separate from the outer control so a model write
   * never emits a transient value to the consumer's form, and so `onTouched` fires only for a
   * real user pick (the only thing that reaches `valueChanges` here).
   */
  protected readonly innerControl = new FormControl<unknown>(null);

  /**
   * Which value the rendered radios currently show as checked. Tracked separately from
   * {@link innerControl} because the two go out of step: on a user pick, `tn-radio` writes the
   * control directly, and Angular suppresses the model->view write on the accessor that
   * originated the change — so every *other* `tn-radio` keeps a stale `checked === true` field
   * even though the browser has already unchecked its `<input>`.
   */
  private renderedValue: unknown = Symbol('unrendered');

  /**
   * Part of the `@for` track key. Writing the same value straight back after a user pick would
   * be a no-op for the target radio's `[checked]` binding — Angular sees `true -> true` and skips
   * the DOM write, leaving the group rendered with nothing selected. Bumping this key on a model
   * write instead destroys and recreates the radios, so each one runs `writeValue` fresh on init
   * and renders the right state with no imperative change-detection pass. A user pick does not
   * bump it, so keyboard focus survives the interaction it came from.
   */
  private readonly renderKey = signal(0);

  /**
   * The options paired with their `@for` track keys. Built here rather than reading
   * {@link renderKey} straight from the `track` expression, which the repeater evaluates outside
   * the view's reactive context — so the signal read would not mark the view dirty and the
   * recreation would never be scheduled.
   */
  protected readonly renderItems = computed(() => {
    const key = this.renderKey();
    return this.options().map((option) => ({ option, trackBy: `${key}-${String(option.value)}` }));
  });

  private onChange: (value: unknown) => void = (): void => {};
  private onTouched: () => void = (): void => {};

  constructor() {
    this.controlDirective.valueAccessor = this;

    this.innerControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((value) => {
      // `writeValue` sets the control with `emitEvent: false`, so reaching here means a
      // `tn-radio` wrote it — i.e. the user picked an option.
      this.renderedValue = value;
      this.onChange(value);
      this.onTouched();
    });
  }

  protected optionTestId(option: Option<unknown>): string[] {
    return [...this.testId(), option.label];
  }

  writeValue(value: unknown): void {
    if (this.renderedValue === value) {
      return;
    }
    this.renderedValue = value;
    this.innerControl.setValue(value, { emitEvent: false });
    this.renderKey.update((key) => key + 1);
  }

  registerOnChange(onChange: (value: unknown) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.innerControl.disable({ emitEvent: false });
    } else {
      this.innerControl.enable({ emitEvent: false });
    }
  }
}
