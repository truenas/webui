import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';

describe('mockWindow', () => {
  it('returns a ValueProvider with WINDOW token', () => {
    const result = mockWindow();
    expect(result.provide).toBe(WINDOW);
    expect(result.useValue).toBeDefined();
  });

  it('provides default window properties', () => {
    const result = mockWindow();
    const window = result.useValue as Window;

    expect(window.location.protocol).toBe('http:');
    expect(window.location.hostname).toBe('truenas.com');
    expect(window.open).toBeDefined();
    expect(window.localStorage.setItem).toBeDefined();
    expect(window.sessionStorage.getItem).toBeDefined();
  });

  it('merges shallow overrides', () => {
    const result = mockWindow({
      location: { hostname: 'custom.host' },
    });
    const window = result.useValue as Window;

    expect(window.location.hostname).toBe('custom.host');
    expect(window.location.protocol).toBe('http:');
  });

  it('merges nested overrides', () => {
    const result = mockWindow({
      location: {
        protocol: 'https:',
        hostname: 'secure.host',
      },
    });
    const window = result.useValue as Window;

    expect(window.location.protocol).toBe('https:');
    expect(window.location.hostname).toBe('secure.host');
  });

  it('blocks __proto__ pollution attempts', () => {
    const maliciousOverride = JSON.parse('{"__proto__": {"polluted": true}}');
    const result = mockWindow(maliciousOverride as never);
    const window = result.useValue as Record<string, unknown>;

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(window.polluted).toBeUndefined();
  });

  it('blocks constructor pollution attempts', () => {
    const result = mockWindow({
      constructor: { polluted: true },
    } as never);
    const window = result.useValue as Record<string, unknown>;

    expect((window.constructor as unknown as Record<string, unknown>)?.polluted).toBeUndefined();
  });

  it('blocks prototype pollution attempts', () => {
    const result = mockWindow({
      prototype: { polluted: true },
    } as never);
    const window = result.useValue as Record<string, unknown>;

    expect(window['prototype']).toBeUndefined();
  });

  it('handles array values correctly', () => {
    const customArray = ['item1', 'item2'];
    const result = mockWindow({
      customProp: customArray,
    } as never);
    const window = result.useValue as Record<string, unknown>;

    expect(window['customProp']).toEqual(customArray);
  });

  it('handles function values correctly', () => {
    const customFn = jest.fn();
    const result = mockWindow({
      customMethod: customFn,
    } as never);
    const window = result.useValue as Record<string, unknown>;

    expect(window['customMethod']).toBe(customFn);
  });

  it('does not mutate the original overrides object', () => {
    const overrides = { location: { hostname: 'test.host' } };
    const originalOverrides = JSON.stringify(overrides);
    mockWindow(overrides);

    expect(JSON.stringify(overrides)).toBe(originalOverrides);
  });
});
