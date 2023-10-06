import { OperatorFunction, Observable, switchMap, map, timer } from 'rxjs';

/**
 * Creates an RxJS operator that calculates the elapsed time in milliseconds
 * since a specific starting point.
 *
 * @param {number=} [interval=60000] - (optional) The interval in milliseconds at which
 * the elapsed time should be updated. Default value is 60 seconds.
 * @returns {OperatorFunction<number, number>} An RxJS operator that transforms
 * the source observable.
 *
 * @example
 * // Use the operator to measure elapsed time for emitted values.
 * const initialMilliseconds = 1234567;
 * of(initialMilliseconds).pipe(elapsedTime(30000)).subscribe((elapsedTime) => {
 *   console.info(`Elapsed Time: ${elapsedTime} ms`);
 * });
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
