import { ValueProvider } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { DeepPartial } from 'utility-types';
import { WINDOW } from 'app/helpers/window.helper';

export function mockWindow(overrides: DeepPartial<Window> = {}): ValueProvider {
  const baseWindow = {
    location: {
      protocol: 'http:',
      href: 'http://truenas.com',
      hostname: 'truenas.com',
      port: '',
      pathname: '/',
      replace: jest.fn(),
    },
    open: jest.fn(),
    localStorage: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    sessionStorage: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
  } as DeepPartial<Window>;

  // Deep clone the base to avoid mutations
  const result = cloneDeep(baseWindow);

  // Manually handle deep merge to ensure all properties are preserved
  const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Function)) {
        if (!target[key]) {
          target[key] = {};
        }
        deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        target[key] = source[key];
      }
    });
    return target;
  };

  deepMerge(result as Record<string, unknown>, overrides as Record<string, unknown>);
  // Special handling for location to ensure toString works properly
  if (overrides.location && typeof overrides.location.toString === 'function' && result.location) {
    const originalToString = overrides.location.toString;
    result.location.toString = originalToString;
  }

  return {
    provide: WINDOW,
    useValue: result,
  };
}
