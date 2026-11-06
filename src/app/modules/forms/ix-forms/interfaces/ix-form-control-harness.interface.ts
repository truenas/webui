/**
 * Returned by a control harness that can't read the control it wraps (e.g. a `tn-chip-input` in a
 * field). Whole-form readers omit such controls, so a form-wide `toEqual` fails instead of passing on
 * an unread value. Declared with the contract because both readers are generic over it.
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
