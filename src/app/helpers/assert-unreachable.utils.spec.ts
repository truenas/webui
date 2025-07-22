import { assertUnreachable } from './assert-unreachable.utils';

describe('assertUnreachable', () => {
  it('logs an error for unreachable value', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    assertUnreachable('bad' as never);
    expect(spy).toHaveBeenCalledWith('No such case in exhaustive switch: bad');
    spy.mockRestore();
  });
});
