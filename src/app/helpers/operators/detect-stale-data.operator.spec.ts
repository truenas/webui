import { of, Subject } from 'rxjs';
import { detectStaleData, StaleDataState } from './detect-stale-data.operator';

describe('detectStaleData', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initially emit with null value and not stale', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(0);

    expect(results[0]).toEqual({
      value: null,
      isStale: false,
    });
  });

  it('should emit value and not stale when data is fresh', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(0);
    source$.next(42);
    jest.advanceTimersByTime(1000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: false,
    });
  });

  it('should mark data as stale after timeout', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(0);
    source$.next(42);
    jest.advanceTimersByTime(6000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: true,
    });
  });

  it('should reset stale flag when new data arrives', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(0);
    source$.next(42);
    jest.advanceTimersByTime(6000);

    const staleState = results[results.length - 1];
    expect(staleState.isStale).toBe(true);

    source$.next(100);
    jest.advanceTimersByTime(1000);

    const freshState = results[results.length - 1];
    expect(freshState).toEqual({
      value: 100,
      isStale: false,
    });
  });

  it('should use custom timeout value', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(2000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(0);
    source$.next(42);
    jest.advanceTimersByTime(3000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: true,
    });
  });

  it('should handle immediate source', () => {
    const results: StaleDataState<number>[] = [];

    of(42).pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(1000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: false,
    });
  });

  it('should mark as stale when no data arrives at all', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(0);
    expect(results[results.length - 1]).toEqual({
      value: null,
      isStale: false,
    });

    jest.advanceTimersByTime(6000);

    expect(results[results.length - 1]).toEqual({
      value: null,
      isStale: true,
    });
  });

  it('should transition from stale (no data) to fresh when data arrives', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    jest.advanceTimersByTime(6000);

    expect(results[results.length - 1]).toEqual({
      value: null,
      isStale: true,
    });

    source$.next(100);
    jest.advanceTimersByTime(1000);

    expect(results[results.length - 1]).toEqual({
      value: 100,
      isStale: false,
    });
  });

  it('should handle source errors gracefully', () => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];
    let errorReceived: unknown = null;

    source$.pipe(detectStaleData(5000)).subscribe({
      next: (state) => results.push(state),
      error: (err: unknown) => {
        errorReceived = err;
      },
    });

    jest.advanceTimersByTime(1000);
    source$.next(42);
    jest.advanceTimersByTime(1000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: false,
    });

    source$.error(new Error('Test error'));

    expect(errorReceived).toBeDefined();
    expect((errorReceived as Error)?.message).toBe('Test error');
  });
});
