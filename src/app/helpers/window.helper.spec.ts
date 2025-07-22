/* eslint-disable no-restricted-globals */
import { getWindow } from './window.helper';

describe('getWindow', () => {
  it('returns global window object', () => {
    expect(getWindow()).toBe(window);
  });
});
