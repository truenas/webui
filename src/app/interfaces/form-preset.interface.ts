/**
 * What a flow that opens a form wants it to start as, when the record it is
 * about to create is not a general-purpose one.
 *
 * The shape is shared so that every picker and form names the same thing the
 * same way; applying it is not. A form patches its own controls, because only
 * the form knows the order its cross-field rules impose — a value set ahead of
 * the one it depends on is silently reverted, and a generic patcher walking a
 * `FormGroup` cannot know that.
 *
 * Forms narrow `T` to the keys they actually honour, and `L` to the subset
 * they can actually lock, so a caller naming anything else fails to compile
 * rather than passing something nothing applies. The two differ whenever a
 * control is presettable but not freezable — usually because the form's own
 * watchers drive its disabled state and would undo a lock:
 *
 * ```ts
 * export type UserFormPreset = FormPreset<Pick<UserUpdate, 'smb' | 'password_disabled'>, 'smb'>;
 * ```
 *
 * For a NEW record only. An edit form is about something that already exists,
 * and none of this would be an honest thing to say about it.
 */
export interface FormPreset<T, L extends keyof T = keyof T> {
  /**
   * What the form opens holding. A starting point: the user is free to change
   * any of it, unless the same key is also {@link locked}.
   */
  values?: Partial<T>;

  /**
   * Keys the flow fixes, rendered disabled. For a setting that is a
   * precondition of the flow rather than a default — something the user would
   * otherwise have to notice and undo for the record to be usable at all.
   *
   * Narrower than the keys of {@link values} where a form can start a control
   * off but not hold it there.
   */
  locked?: L[];
}
