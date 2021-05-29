/**
 * Nodejs and browser return different types for setTimeout.
 */
export type Timeout = ReturnType<typeof setTimeout>;
export type Interval = ReturnType<typeof setInterval>;
