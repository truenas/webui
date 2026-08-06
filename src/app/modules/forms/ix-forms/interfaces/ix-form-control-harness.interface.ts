/**
 * Returned by a control harness asked for something it cannot read off the control it wraps —
 * `TnFormControlHarness` over a `tn-form-field` holding a `tn-chip-input`, say. Whole-form readers
 * (`getControlValues`, `getDisabledStates`) leave such a control out of their result entirely
 * rather than reporting a stand-in for it, so a form-wide `toEqual` fails on the missing key
 * instead of passing against something that was never read from anything.
 *
 * Declared next to the contract rather than next to its only producer today, because both
 * whole-form readers are generic over {@link IxFormControlHarness} — the sentinel is part of what
 * that interface promises, not an implementation detail of one harness.
 */
export const unreadableControl = Symbol('unreadableControl');

export interface IxFormControlHarness {
  getLabelText(): Promise<string>;
  /** {@link unreadableControl} when the harness has no way to read this control's value. */
  getValue(): Promise<unknown>;
  setValue(value: unknown): Promise<void>;
  /**
   * {@link unreadableControl} when the harness has no way to read this control's disabled state —
   * the same treatment {@link getValue} gives an unreadable value. Answering `false` there would
   * let `expect(await form.getDisabledState()).toEqual({ Tags: false })` pass against a control
   * that is genuinely disabled.
   */
  isDisabled(): Promise<boolean | typeof unreadableControl>;
}
