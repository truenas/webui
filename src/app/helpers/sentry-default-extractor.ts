import { HttpErrorResponse } from '@angular/common/http';

export const sentryDefaultExtractor = (errorCandidate: unknown): unknown => {
  let error = errorCandidate;

  // Try to unwrap zone.js error.
  // https://github.com/angular/angular/blob/master/packages/core/src/util/errors.ts
  if (error && (error as { ngOriginalError: Error }).ngOriginalError) {
    error = (error as { ngOriginalError: Error }).ngOriginalError;
  }

  // We can handle messages and Error objects directly.
  if (typeof error === 'string' || error instanceof Error) {
    return error;
  }

  // If it's http module error, extract as much information from it as we can.
  if (error instanceof HttpErrorResponse) {
    // The `error` property of http exception can be either an `Error` object, which we can use directly...
    if (error.error instanceof Error) {
      return error.error;
    }

    if (error.error instanceof ErrorEvent && error.error.message) {
      return error.error;
    }

    // ... or an`ErrorEvent`, which can provide us with the message but no stack...
    if (error.error instanceof ErrorEvent && error.error.message) {
      return error.error.message;
    }

    // ...or the request body itself, which we can use as a message instead.
    if (typeof error.error === 'string') {
      return `Server returned code ${error.status} with body "${error.error}"`;
    }

    // If we don't have any detailed information, fallback to the request message itself.
    return error.message;
  }

  // Nothing was extracted, fallback to default error message.
  return JSON.stringify(error);
};
