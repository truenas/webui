import { TestScheduler } from 'rxjs/testing';

/**
 * Creates TestScheduler for rxjs marble testing.
 */
export function getTestScheduler(): TestScheduler {
  return new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
}
