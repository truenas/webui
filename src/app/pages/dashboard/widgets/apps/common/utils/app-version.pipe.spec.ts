import { AppVersionPipe } from './app-version.pipe';

describe('AppVersionPipe', () => {
  let pipe: AppVersionPipe;

  beforeEach(() => {
    pipe = new AppVersionPipe();
  });

  it('should return the value if it starts with "v"', () => {
    expect(pipe.transform('v1.0.0')).toBe('v1.0.0');
  });

  it('should prepend "v" to the value if it does not start with "v"', () => {
    expect(pipe.transform('1.0.0')).toBe('v1.0.0');
  });

  it('should handle an empty string', () => {
    expect(pipe.transform('')).toBe('');
  });
});
