import { stringToTitleCase } from './string-to-title-case';

describe('stringToTitleCase', () => {
  it('capitalizes first letter of each word', () => {
    expect(stringToTitleCase('hello WORLD')).toBe('Hello World');
  });
});
