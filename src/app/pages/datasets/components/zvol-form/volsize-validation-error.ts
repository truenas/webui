/**
 * Raised instead of issuing the update when the new volsize is smaller than the current one (zvols
 * cannot shrink). Its own type rather than a sentinel message, so the form's `onError` recognises it
 * by `instanceof` and can't be broken by rewording.
 */
export class VolsizeValidationError extends Error {}
