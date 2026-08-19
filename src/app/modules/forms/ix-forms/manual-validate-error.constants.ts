/**
 * Error keys `FormErrorHandlerService` writes onto a control whose error came from the backend
 * rather than from a validator. They travel as a set — the active key is the bare boolean
 * {@link manualValidateErrorKey}, while the human-readable text lives in the two siblings — so they
 * are declared together here rather than re-spelled at each reader (the error-message resolver, the
 * legacy `ix-errors` component, `<ix-form-renderer>`'s error clearing).
 *
 * Unlike a validator result these are pinned with `setErrors()` and never re-evaluate, so consumers
 * that need to tell a live validation failure from a stale server verdict key off
 * {@link manualValidateErrorKey}.
 */
export const manualValidateErrorKey = 'manualValidateError';
export const manualValidateErrorMsgKey = 'manualValidateErrorMsg';
export const ixManualValidateErrorKey = 'ixManualValidateError';
