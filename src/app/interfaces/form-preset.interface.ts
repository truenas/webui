/**
 * What a flow wants a form to start as when the new record isn't a general-purpose one. Each form
 * applies it itself, since only it knows the order its cross-field rules need. Forms narrow `T` to the
 * keys they honour and `L` to those they can lock, so anything else fails to compile; a control can be
 * presettable but not lockable when the form's own watchers drive it. For new records only.
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
