import {
  Observable, OperatorFunction, combineLatest, timer,
} from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';

export interface StaleDataState<T> {
  value: T | null;
  isStale: boolean;
}

/**
 * Operator that detects if an observable hasn't emitted within a specified timeout.
 * Returns an object with the latest value and a flag indicating if data is stale.
 *
 * @param timeoutMs - Milliseconds to wait before marking data as stale (default: 5000)
 * @returns An operator function that emits StaleDataState
 */
export function detectStaleData<T>(timeoutMs = 5000): OperatorFunction<T, StaleDataState<T>> {
  const startTime = Date.now();

  return (source$: Observable<T>): Observable<StaleDataState<T>> => {
    return combineLatest([
      source$.pipe(
        map((value) => ({ value, timestamp: Date.now() })),
        startWith({ value: null as T | null, timestamp: startTime }),
      ),
      timer(0, 1000), // Check every second
    ]).pipe(
      map(([data, _]) => {
        const timeSinceLastUpdate = Date.now() - data.timestamp;
        const isStale = timeSinceLastUpdate > timeoutMs;
        return {
          value: data.value,
          isStale,
        };
      }),
      distinctUntilChanged((prev, curr) => prev.isStale === curr.isStale && prev.value === curr.value),
    );
  };
}
