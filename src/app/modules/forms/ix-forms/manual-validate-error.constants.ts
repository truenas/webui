/**
 * Error keys `FormErrorHandlerService` sets for backend errors, declared together because they travel as
 * a set: {@link manualValidateErrorKey} is the active boolean and the siblings carry the text. They are
 * pinned with `setErrors()` and never re-evaluate, so key off {@link manualValidateErrorKey} to tell a
 * stale server verdict from a live validation failure.
 */
export const manualValidateErrorKey = 'manualValidateError';
export const manualValidateErrorMsgKey = 'manualValidateErrorMsg';
export const ixManualValidateErrorKey = 'ixManualValidateError';
