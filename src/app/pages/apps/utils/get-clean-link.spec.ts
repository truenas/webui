import { getCleanLink } from 'app/pages/apps/utils/get-clean-link';

describe('getCleanLink', () => {
  it('transforms a URL into a shorter form', () => {
    expect(getCleanLink('https://www.google.com/')).toBe('google.com');
    expect(getCleanLink('https://www.google.com/test/')).toBe('google.com/test');
  });
});
