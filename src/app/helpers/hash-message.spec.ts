import { hashMessage } from 'app/helpers/hash-message';

describe('hashMessage', () => {
  it('should return a base64-encoded string', () => {
    const message = 'Hello, World!';
    const expected = btoa(encodeURIComponent(message));
    expect(hashMessage(message)).toBe(expected);
  });

  it('should handle empty strings', () => {
    expect(hashMessage('')).toBe(btoa(encodeURIComponent('')));
  });

  it('should correctly encode special characters', () => {
    const message = 'Тестові символи: ñ, ü, á, ß';
    const expected = btoa(encodeURIComponent(message));
    expect(hashMessage(message)).toBe(expected);
  });

  it('should encode Unicode characters correctly', () => {
    const message = '你好，世界！';
    const expected = btoa(encodeURIComponent(message));
    expect(hashMessage(message)).toBe(expected);
  });
});
