import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subscription } from 'rxjs';
import {
  relativeDateTickInterval, RelativeDateTickerService,
} from 'app/modules/dates/services/relative-date-ticker.service';

describe('RelativeDateTickerService', () => {
  let spectator: SpectatorService<RelativeDateTickerService>;
  let subscriptions: Subscription;

  const createService = createServiceFactory(RelativeDateTickerService);

  beforeEach(() => {
    jest.useFakeTimers();
    spectator = createService();
    subscriptions = new Subscription();
  });

  afterEach(() => {
    subscriptions.unsubscribe();
    jest.useRealTimers();
  });

  it('emits immediately so a first render does not wait out the interval', () => {
    const emitted: number[] = [];
    subscriptions.add(spectator.service.tick$.subscribe((value) => emitted.push(value)));

    expect(emitted).toEqual([0]);
  });

  it('keeps emitting on the interval', () => {
    const emitted: number[] = [];
    subscriptions.add(spectator.service.tick$.subscribe((value) => emitted.push(value)));

    jest.advanceTimersByTime(relativeDateTickInterval * 2);

    expect(emitted).toHaveLength(3);
  });

  it('runs one shared timer for all subscribers', () => {
    const first: number[] = [];
    const second: number[] = [];
    subscriptions.add(spectator.service.tick$.subscribe((value) => first.push(value)));
    subscriptions.add(spectator.service.tick$.subscribe((value) => second.push(value)));

    jest.advanceTimersByTime(relativeDateTickInterval);

    // A second timer would put the two subscribers out of step.
    expect(first).toEqual(second);
    expect(jest.getTimerCount()).toBe(1);
  });

  it('stops the timer once the last subscriber leaves', () => {
    const subscription = spectator.service.tick$.subscribe();
    expect(jest.getTimerCount()).toBe(1);

    subscription.unsubscribe();

    expect(jest.getTimerCount()).toBe(0);
  });
});
