import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input,
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule,
} from '@angular/forms';
import { TnRadioComponent } from '@truenas/ui-components';
import { Option } from 'app/interfaces/option.interface';

/**
 * A `role="radiogroup"` wrapper around a set of `<tn-radio>`s.
 *
 * `tn-radio` is a per-option `ControlValueAccessor` with no group component of its own, so every
 * consumer that wants a radio group has to hand-roll one. This centralizes the two things that
 * are easy to get wrong when doing that:
 *
 * 1. **ARIA.** `tn-radio` does not consume the surrounding `tn-form-field`'s label context, so
 *    without an explicit `role="radiogroup"` + accessible name the options are announced
 *    ungrouped. Pass {@link ariaLabel} (usually the same text as the field's label).
 * 2. **Reset staleness.** See {@link writeValue}.
 *
 * Bind it like any other control: `<ix-tn-radio-group formControlName="…">`.
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
  private cdr = inject(ChangeDetectorRef);

  readonly options = input<Option<unknown>[]>([]);

  /**
   * Accessible name for the group. Required in practice — a `radiogroup` with no name is
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

  /**
   * Drives the `<tn-radio>` accessors. Kept separate from the outer control so the reset flush
   * in {@link writeValue} never emits a transient value to the consumer's form.
   */
  protected readonly innerControl = new FormControl<unknown>(null);

  private onChange: (value: unknown) => void = (): void => {};
  private onTouched: () => void = (): void => {};

  constructor() {
    this.controlDirective.valueAccessor = this;

    this.innerControl.valueChanges.subscribe((value) => {
      this.onChange(value);
      this.onTouched();
    });
  }

  protected optionTestId(option: Option<unknown>): string[] {
    return [...this.testId(), option.label];
  }

  /**
   * Always flushes through `null` before writing the new value.
   *
   * Angular suppresses the model->view write on the accessor that originated a change, so after
   * the user picks an option every *other* `tn-radio` is left with a stale `checked === true`
   * field even though the browser has already unchecked its `<input>`. Writing the value
   * straight back is then a no-op for that radio's `[checked]` binding — Angular sees
   * `true -> true` and skips the DOM write — and the group renders with nothing selected. The
   * `null` pass (flushed with {@link ChangeDetectorRef.detectChanges} so it reaches the DOM)
   * forces every binding to actually transition.
   *
   * The flush is confined to {@link innerControl} with `emitEvent: false`, so the consumer's
   * control never sees the transient `null` and no `valueChanges` subscriber is woken by it.
   */
  writeValue(value: unknown): void {
    this.innerControl.setValue(null, { emitEvent: false });
    this.cdr.detectChanges();
    this.innerControl.setValue(value, { emitEvent: false });
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }
}
