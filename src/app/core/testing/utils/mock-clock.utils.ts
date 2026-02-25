/**
 * Freezes the system clock to a fixed date for deterministic tests.
 * Only fakes Date — timers (setTimeout, setInterval, etc.) remain real
 * so Angular async operations work normally.
 *
 * Usage:
 *   beforeEach(() => fakeDate(new Date('2026-01-20T00:00:00Z')));
 *   afterEach(() => restoreDate());
 */
export function fakeDate(date: Date): void {
  jest.useFakeTimers({
    doNotFake: [
      'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask',
    ],
  });
  jest.setSystemTime(date);
}

export function restoreDate(): void {
  jest.useRealTimers();
}
