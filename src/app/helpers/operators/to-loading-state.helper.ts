import { of, OperatorFunction, pipe } from 'rxjs';
import {
  catchError, map, startWith,
} from 'rxjs/operators';

export interface LoadingState<T> {
  isLoading: boolean;
  value?: T | null;
  error?: unknown;
}

/**
 * Wraps a stream in `{ isLoading, value, error }` for templates, e.g.
 * `this.api.call('my.method').pipe(toLoadingState())`. Add `shareReplay` if several places use it.
 */
export function toLoadingState<T>(): OperatorFunction<T, LoadingState<T>> {
  return pipe(
    map((value) => ({ isLoading: false, value })),
    catchError((error: unknown) => of({ isLoading: false, error })),
    startWith({ isLoading: true }),
  );
}
