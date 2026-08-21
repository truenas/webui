/**
 * Response emitted when a side-panel-hosted form closes.
 *
 * - `response` holds the value returned by the form on success.
 * - `undefined` signals that the user cancelled (closed without saving).
 *
 * {@link SlideInResult} convenience methods (onSuccess, onCancel, success$)
 * use a strict `=== undefined` check, so forms may safely return any value
 * (including `null`, `false`, `0`, `''`) as a legitimate success response.
 */
export interface SlideInResponse<T = unknown> {
  response: T | undefined;
}
