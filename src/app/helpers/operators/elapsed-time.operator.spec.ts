import { of, take } from 'rxjs';
import { elapsedTime } from 'app/helpers/operators/elapsed-time.operator';

describe('elapsedTime', () => {
  const createElapsedTimeTest = (initialMilliseconds: number, interval: number, ticks: number): number[] => {
    const output: number[] = [];

    jest.useFakeTimers();

    const subscription = of(initialMilliseconds)
      .pipe(elapsedTime(interval), take(ticks))
      .subscribe((value) => {
        output.push(value);
      });

    jest.advanceTimersByTime(interval * ticks);
    subscription.unsubscribe();

    jest.useRealTimers();

    return output;
  };

  it('should correctly calculate elapsed time in milliseconds', () => {
    const initialMilliseconds = 1696516938592;
    const ticks = 5;
    const interval = 60000;
    const output: number[] = createElapsedTimeTest(initialMilliseconds, interval, ticks);
    const expected = Array.from({ length: ticks }, (_, index) => initialMilliseconds + interval * index);

    expect(output).toEqual(expected);

    const dates = output.map((timestamp) => new Date(timestamp).toISOString());

    expect(dates).toEqual([
      '2023-10-05T14:42:18.592Z',
      '2023-10-05T14:43:18.592Z',
      '2023-10-05T14:44:18.592Z',
      '2023-10-05T14:45:18.592Z',
      '2023-10-05T14:46:18.592Z',
    ]);
  });

  it('should calculate the elapsed time correctly with the custom interval', () => {
    const initialMilliseconds = 1696578754786;
    const ticks = 10;
    const interval = 10000;
    const output: number[] = createElapsedTimeTest(initialMilliseconds, interval, ticks);
    const expected = Array.from({ length: ticks }, (_, index) => initialMilliseconds + interval * index);

    expect(output).toEqual(expected);

    const dates = output.map((timestamp) => new Date(timestamp).toISOString());

    expect(dates).toEqual([
      '2023-10-06T07:52:34.786Z',
      '2023-10-06T07:52:44.786Z',
      '2023-10-06T07:52:54.786Z',
      '2023-10-06T07:53:04.786Z',
      '2023-10-06T07:53:14.786Z',
      '2023-10-06T07:53:24.786Z',
      '2023-10-06T07:53:34.786Z',
      '2023-10-06T07:53:44.786Z',
      '2023-10-06T07:53:54.786Z',
      '2023-10-06T07:54:04.786Z',
    ]);
  });
});
