import { OperatorFunction, Observable, switchMap, map, timer } from 'rxjs';

/**
 * Calculates the elapsed time in milliseconds since a specific starting point.
 * @returns {OperatorFunction<number, number>} An RxJS operator that transforms the source observable.
 * @returns {Observable<number>} An observable emitting the elapsed time in milliseconds.
 */
export function elapsedTime(interval = 60000): OperatorFunction<number, number> {
  return (source$: Observable<number>): Observable<number> => source$.pipe(
    switchMap((initialMilliseconds) =>
      timer(0, interval).pipe(
        map((tick) => initialMilliseconds + tick * interval),
      ),
    ),
  );
}
