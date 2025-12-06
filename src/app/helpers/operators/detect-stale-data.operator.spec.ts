import { fakeAsync, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { detectStaleData, StaleDataState } from './detect-stale-data.operator';

describe('detectStaleData', () => {
  it('should initially emit with null value and not stale', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    tick(0);

    expect(results[0]).toEqual({
      value: null,
      isStale: false,
    });
  }));

  it('should emit value and not stale when data is fresh', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    tick(0);
    source$.next(42);
    tick(1000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: false,
    });
  }));

  it('should mark data as stale after timeout', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    tick(0);
    source$.next(42);
    tick(6000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: true,
    });
  }));

  it('should reset stale flag when new data arrives', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    tick(0);
    source$.next(42);
    tick(6000);

    const staleState = results[results.length - 1];
    expect(staleState.isStale).toBe(true);

    source$.next(100);
    tick(1000);

    const freshState = results[results.length - 1];
    expect(freshState).toEqual({
      value: 100,
      isStale: false,
    });
  }));

  it('should use custom timeout value', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(2000)).subscribe((state) => results.push(state));

    tick(0);
    source$.next(42);
    tick(3000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: true,
    });
  }));

  it('should handle immediate source', fakeAsync(() => {
    const results: StaleDataState<number>[] = [];

    of(42).pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    tick(1000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: false,
    });
  }));

  it('should mark as stale when no data arrives at all', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    tick(0);
    expect(results[results.length - 1]).toEqual({
      value: null,
      isStale: false,
    });

    tick(6000);

    expect(results[results.length - 1]).toEqual({
      value: null,
      isStale: true,
    });
  }));

  it('should transition from stale (no data) to fresh when data arrives', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];

    source$.pipe(detectStaleData(5000)).subscribe((state) => results.push(state));

    tick(6000);

    expect(results[results.length - 1]).toEqual({
      value: null,
      isStale: true,
    });

    source$.next(100);
    tick(1000);

    expect(results[results.length - 1]).toEqual({
      value: 100,
      isStale: false,
    });
  }));

  it('should handle source errors gracefully', fakeAsync(() => {
    const source$ = new Subject<number>();
    const results: StaleDataState<number>[] = [];
    let errorReceived: unknown = null;

    source$.pipe(detectStaleData(5000)).subscribe({
      next: (state) => results.push(state),
      error: (err: unknown) => {
        errorReceived = err;
      },
    });

    tick(1000);
    source$.next(42);
    tick(1000);

    expect(results[results.length - 1]).toEqual({
      value: 42,
      isStale: false,
    });

    source$.error(new Error('Test error'));

    expect(errorReceived).toBeDefined();
    expect((errorReceived as Error)?.message).toBe('Test error');
  }));
});
