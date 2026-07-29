import {
  afterNextRender,
  ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, Injector, input, isDevMode, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TnFormFieldComponent, TnRadioComponent } from '@truenas/ui-components';
import { Option } from 'app/interfaces/option.interface';

/** Feeds the per-instance discriminator in {@link TnRadioGroupComponent.nativeName}. */
let nextInstanceId = 0;

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
 * **No validation display.** The group does not consume `TN_FORM_FIELD_CONTEXT`, so a wrapping
 * `tn-form-field` never renders error text for it — a `Validators.required` group will block
 * submission with no visible reason. (Nor does `touched` help: see the note in the constructor.)
 * A group that needs a required-ness message has to render it itself —
 * {@link assertNoRequiredValidator} flags the trap in dev mode.
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
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);

  private readonly instanceId = nextInstanceId++;

  readonly options = input<Option<unknown>[]>([]);

  /**
   * Lays the options out in a wrapping row instead of stacking them, matching what
   * `ix-radio-group`'s `inlineFields` did. Opt-in: stacked is the right default for anything
   * longer than a two-option yes/no, which is the only shape a row reads well at.
   */
  readonly inline = input<boolean>(false);

  /**
   * Accessible name for the group, overriding the enclosing `tn-form-field`'s label. Required
   * when there is no such field, or when it carries no label — a `radiogroup` with no name is
   * announced as an unlabeled group.
   */
  readonly ariaLabel = input<string>('');

  /**
   * Base for the native `name` shared by every option's `<input type="radio">`, which is what
   * makes the browser treat them as one group for arrow-key navigation. Need not be unique —
   * {@link nativeName} appends a per-instance discriminator.
   */
  readonly name = input.required<string>();

  /**
   * Test-id base the option label is appended to, e.g. `['radio-button', 'encryption-type']`
   * resolves to `radio-button-encryption-type-<label>` per option.
   */
  readonly testId = input<string[]>([]);

  /**
   * `null`, not `''`, when there is no name: Angular only drops an attribute binding for
   * `null`/`undefined`, and an emitted `aria-label=""` would hide the missing name from an
   * axe/a11y-lint pass while still being unnamed to a screen reader.
   */
  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() || this.formField?.label() || null);

  /**
   * {@link name} plus a per-instance discriminator. The native `name` scope is the whole document,
   * so two groups sharing one — the same call site repeated in a list — would fuse into a single
   * native group and break arrow-key navigation between them. The name is never user-visible.
   */
  protected readonly nativeName = computed(() => `${this.name()}-${this.instanceId}`);

  /**
   * Drives the `<tn-radio>` accessors. Kept separate from the outer control so a model write
   * never emits a transient value to the consumer's form, and so `onTouched` fires only for a
   * real user pick (the only thing that reaches `valueChanges` here).
   *
   * **Must stay validator-free.** Every `<tn-radio>` in the template binds `[formControl]` to
   * this one instance, so N `FormControlDirective`s attach to it — outside Angular's supported
   * usage, where a control has exactly one accessor. Each `setUpControl` overwrites the
   * control's validators with its own directive's, so the last radio to attach would win; with
   * no validators there is nothing to lose. Validation belongs on the *outer* control the
   * consumer binds, which this component only reads through {@link writeValue}.
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
   * bump it, so keyboard focus survives the interaction it came from; a model write does, and
   * {@link writeValue} restores focus explicitly.
   */
  private readonly renderKey = signal(0);

  /**
   * The options paired with their resolved test ids and `@for` track keys. Built here rather than reading
   * {@link renderKey} straight from the `track` expression, which the repeater evaluates outside
   * the view's reactive context — so the signal read would not mark the view dirty and the
   * recreation would never be scheduled.
   *
   * The index is part of the key so that options whose values stringify alike — two objects
   * (both `[object Object]`), or `1` and `'1'` — still get distinct keys; duplicates would make
   * Angular throw NG0955 and the group would not render at all. The stringified value stays in
   * the key so that swapping the options array recreates the radios rather than rebinding
   * `[value]` on the existing ones, which would leave their `checked` state stale.
   */
  protected readonly renderItems = computed(() => {
    const key = this.renderKey();
    const base = this.testId();
    return this.options().map((option, index) => ({
      option,
      testId: [...base, option.label],
      trackBy: `${key}-${index}-${String(option.value)}`,
    }));
  });

  private onChange: (value: unknown) => void = (): void => {};
  private onTouched: () => void = (): void => {};

  constructor() {
    this.controlDirective.valueAccessor = this;

    if (isDevMode()) {
      // Deferred: the directive binds its `control` after this constructor runs.
      afterNextRender({
        read: () => this.assertNoRequiredValidator(),
      }, { injector: this.injector });
    }

    this.innerControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((value) => {
      // `writeValue` sets the control with `emitEvent: false`, so reaching here means a
      // `tn-radio` wrote it — i.e. the user picked an option.
      this.renderedValue = value;
      this.onChange(value);
      // Marks touched on pick rather than on blur: `tn-radio` exposes no blur output, and its
      // <input> is inside the component's template where a host listener can't see the
      // (non-bubbling) blur event. A required group the user tabs past without picking
      // therefore stays untouched, so touched-gated error text will not show for it.
      this.onTouched();
    });
  }

  /**
   * Turns the class doc's "No validation display" trap into an immediate console error rather than
   * a form that silently refuses to submit: the group renders no error text, and `touched` marks on
   * pick rather than blur, so a required group the user never picked blocks Save with nothing on
   * screen to explain it. Dev-mode only — production ships no check.
   *
   * Only catches `Validators.required` by reference, which is how call sites attach it; a bespoke
   * required-ness validator is invisible here.
   */
  private assertNoRequiredValidator(): void {
    if (!this.controlDirective.control?.hasValidator(Validators.required)) {
      return;
    }

    console.error(
      `<ix-tn-radio-group name="${this.name()}"> is bound to a control with Validators.required, `
      + 'but the group renders no validation error — an unpicked group blocks submission with no '
      + 'visible reason. Render the required-ness message at the call site, or drop the validator.',
    );
  }

  writeValue(value: unknown): void {
    // Reference equality on purpose — do not loosen it to a deep compare. `tn-radio` decides its
    // own `checked` by a comparison we don't control, so skipping the rebuild for a
    // structurally-equal-but-distinct object risks rendering the group with nothing checked.
    // Object-valued options should hoist their `options` array for stable identities instead.
    if (this.renderedValue === value) {
      return;
    }
    // Recreating the radios (below) detaches whichever one holds focus, dropping it to <body>.
    // Restore it afterwards so a programmatic write — a `reset()`, or the pool wizard's
    // "Start Over" — doesn't cost a keyboard user their place.
    const shouldRestoreFocus = this.hasFocus();

    this.renderedValue = value;
    this.innerControl.setValue(value, { emitEvent: false });
    this.renderKey.update((key) => key + 1);

    if (shouldRestoreFocus) {
      afterNextRender({
        read: () => this.focusCheckedOption(),
      }, { injector: this.injector });
    }
  }

  private hasFocus(): boolean {
    const active = this.elementRef.nativeElement.ownerDocument.activeElement;
    return !!active && this.elementRef.nativeElement.contains(active);
  }

  /**
   * Focuses the option the group now renders as checked, falling back to the first one when the
   * written value matches none — a group with nothing checked still has to be reachable by
   * keyboard, and the first radio is where native arrow-key navigation starts.
   */
  private focusCheckedOption(): void {
    const host = this.elementRef.nativeElement;
    const target = host.querySelector<HTMLElement>('input[type="radio"]:checked')
      ?? host.querySelector<HTMLElement>('input[type="radio"]');

    target?.focus();
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
