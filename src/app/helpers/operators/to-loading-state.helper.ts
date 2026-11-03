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
 * Usage:
 * myData$ = this.api.call('my.method').pipe(toLoadingState());
 *
 * @if (myData$ | async; as data) {
 *   @if (data.isLoading) {
 *     <my-loading-spinner></my-loading-spinner>
 *   }
 *   @if (data.error) {
 *     <my-error-component [error]="data.error"></my-error-component>
 *   }
 *   @if (data.value) {
 *     <my-data-component [data]="data.value"></my-data-component>
 *   }
 * }
 *
 * If you need to use your observable in multiple places, don't forget to use shareReplay.
 */
export function toLoadingState<T>(): OperatorFunction<T, LoadingState<T>> {
  return pipe(
    map((value) => ({ isLoading: false, value })),
    catchError((error: unknown) => of({ isLoading: false, error })),
    startWith({ isLoading: true }),
  );
}
