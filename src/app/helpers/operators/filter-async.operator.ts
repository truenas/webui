import {
  filter, map, Observable, OperatorFunction, switchMap, take,
} from 'rxjs';

/**
 * Similar to filter(), but accepts an observable.
 */
export function filterAsync<T>(predicateFactory: (value: T) => Observable<boolean>): OperatorFunction<T, T> {
  return (source$: Observable<T>) => source$.pipe(
    switchMap((value) => {
      const predicate$ = predicateFactory(value);
      return predicate$.pipe(
        take(1),
        filter((result) => result),
        map(() => value),
      );
    }),
  );
}
