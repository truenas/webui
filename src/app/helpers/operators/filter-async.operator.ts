import {
  filter, map, Observable, OperatorFunction, switchMap,
} from 'rxjs';

/**
 * Similar to filter(), but accepts an observable.
 * The first() operator will take the first emitted value from asyncPredicate$
 * and then complete, which means it won't emit multiple times for the same source item.
 */
export function filterAsync<T>(asyncPredicate$: Observable<boolean>): OperatorFunction<T, T> {
  return (source$: Observable<T>) => source$.pipe(
    switchMap((item) => asyncPredicate$.pipe(
      filter((result) => result),
      map(() => item),
    )),
  );
}
