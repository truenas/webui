import { Route } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Observable, of, throwError } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { IdlePreloadingStrategy, preloadDelayMs } from 'app/services/idle-preloading-strategy.service';

describe('IdlePreloadingStrategy', () => {
  let spectator: SpectatorService<IdlePreloadingStrategy>;
  let idleCallbacks: (() => void)[];

  const createService = createServiceFactory({
    service: IdlePreloadingStrategy,
    providers: [
      {
        provide: WINDOW,
        useFactory: () => ({
          setTimeout: (callback: () => void, ms?: number) => setTimeout(callback, ms),
          requestIdleCallback: (callback: () => void) => {
            idleCallbacks.push(callback);
            return idleCallbacks.length;
          },
        }),
      },
    ],
  });

  async function runIdleCallback(): Promise<void> {
    idleCallbacks.shift()?.();
    await jest.advanceTimersByTimeAsync(0);
  }

  function preload(load: () => Observable<unknown>): unknown[] {
    const values: unknown[] = [];
    spectator.service.preload({} as Route, load).subscribe((value) => values.push(value));
    return values;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    idleCallbacks = [];
    spectator = createService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads nothing until the delay has passed and the browser is idle', async () => {
    const load = jest.fn(() => of('loaded'));
    const values = preload(load);

    await jest.advanceTimersByTimeAsync(preloadDelayMs - 1);
    expect(idleCallbacks).toHaveLength(0);
    expect(load).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(idleCallbacks).toHaveLength(1);
    expect(load).not.toHaveBeenCalled();

    await runIdleCallback();
    expect(load).toHaveBeenCalledTimes(1);
    expect(values).toEqual(['loaded']);
  });

  it('starts each route in an idle period of its own, in order', async () => {
    const first = jest.fn(() => of(1));
    const second = jest.fn(() => of(2));
    preload(first);
    preload(second);

    await jest.advanceTimersByTimeAsync(preloadDelayMs);
    await runIdleCallback();
    expect(first).toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    await runIdleCallback();
    expect(second).toHaveBeenCalled();
  });

  it('does not wait for a route to finish loading before starting the next', async () => {
    const parent = jest.fn(() => new Observable<never>());
    const child = jest.fn(() => of('child'));
    preload(parent);
    preload(child);

    await jest.advanceTimersByTimeAsync(preloadDelayMs);
    await runIdleCallback();
    await runIdleCallback();

    expect(child).toHaveBeenCalled();
  });

  it('swallows a failed load, as PreloadAllModules does', async () => {
    const values = preload(() => throwError(() => new Error('Chunk failed')));

    await jest.advanceTimersByTimeAsync(preloadDelayMs);
    await runIdleCallback();

    expect(values).toEqual([null]);
  });
});
