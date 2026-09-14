/**
 * What a flow that opens a form wants it to start as, when the record it is
 * about to create is not a general-purpose one.
 *
 * The shape is shared so that every picker, panel host and form names the same
 * thing the same way; applying it is not. A form patches its own controls,
 * because only the form knows the order its cross-field rules impose — a value
 * set ahead of the one it depends on is silently reverted, and a generic
 * patcher walking a `FormGroup` cannot know that.
 *
 * Forms narrow `T` to the keys they actually honour, so a caller naming
 * anything else fails to compile rather than passing a value nothing applies:
 *
 * ```ts
 * export type UserFormPreset = FormPreset<Pick<UserUpdate, 'smb' | 'password_disabled'>>;
 * ```
 *
 * For a NEW record only. An edit form is about something that already exists,
 * and none of this would be an honest thing to say about it.
 */
export interface FormPreset<T> {
  /**
   * What the form opens holding. A starting point: the user is free to change
   * any of it, unless the same key is also {@link locked}.
   */
  values?: Partial<T>;

  /**
   * Keys the flow fixes, rendered disabled. For a setting that is a
   * precondition of the flow rather than a default — something the user would
   * otherwise have to notice and undo for the record to be usable at all.
   */
  locked?: (keyof T)[];
}
