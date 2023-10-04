import { of } from 'rxjs';
import { elapsedTime } from 'app/helpers/operators/elapsed-time.operator';

describe('elapsedTime', () => {
  it('should correctly calculate elapsed time in milliseconds', () => {
    const initialMilliseconds = 1696516938592;

    const expected = [
      initialMilliseconds,
      initialMilliseconds + 60000,
      initialMilliseconds + 60000 * 2,
      initialMilliseconds + 60000 * 3,
      initialMilliseconds + 60000 * 4,
      initialMilliseconds + 60000 * 5,
    ];

    const output: number[] = [];

    jest.useFakeTimers();
    const observable$ = of(initialMilliseconds).pipe(elapsedTime());
    const subscription = observable$.subscribe((value) => {
      output.push(value);
    });

    jest.advanceTimersByTime(60000 * 5);
    subscription.unsubscribe();
    jest.useRealTimers();
    expect(output).toEqual(expected);

    const dates = output.map((timestamp) => new Date(timestamp).toISOString());

    expect(dates).toEqual([
      '2023-10-05T14:42:18.592Z',
      '2023-10-05T14:43:18.592Z',
      '2023-10-05T14:44:18.592Z',
      '2023-10-05T14:45:18.592Z',
      '2023-10-05T14:46:18.592Z',
      '2023-10-05T14:47:18.592Z',
    ]);
  });
});
