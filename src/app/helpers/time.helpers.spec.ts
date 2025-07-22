import { secondsToDuration } from './time.helpers';

describe('secondsToDuration', () => {
  it('converts seconds to duration object', () => {
    expect(secondsToDuration(3661)).toEqual({ hours: 1, minutes: 1, seconds: 1 });
  });

  it('returns empty object for zero', () => {
    expect(secondsToDuration(0)).toEqual({});
  });
});
