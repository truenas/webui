import {
  filter, map, Observable, OperatorFunction, switchMap,
} from 'rxjs';

/**
 * Similar to filter(), but accepts an observable.
 */
export function filterAsync<T>(asyncPredicate$: Observable<boolean>): OperatorFunction<T, T> {
  return (source$: Observable<T>) => source$.pipe(
    switchMap((item) => asyncPredicate$.pipe(
      filter((result) => result),
      map(() => item),
    )),
  );
}
