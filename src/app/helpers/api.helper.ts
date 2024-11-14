import { ApiError } from 'app/interfaces/api-error.interface';

export function isApiError(error: unknown): error is ApiError {
  if (error === null) return false;

  return typeof error === 'object'
    && 'error' in error
    && 'extra' in error
    && 'reason' in error
    && 'trace' in error;
}
