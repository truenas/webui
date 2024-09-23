import { ValueProvider } from '@angular/core';
import { merge } from 'lodash-es';
import { DeepPartial } from 'utility-types';
import { WINDOW } from 'app/helpers/window.helper';

export function mockWindow(overrides: DeepPartial<Window> = {}): ValueProvider {
  const baseWindow = {
    location: {
      protocol: 'http:',
      href: 'http://truenas.com',
    },
    open: jest.fn(),
  } as DeepPartial<Window>;

  return {
    provide: WINDOW,
    useValue: merge(baseWindow, overrides),
  };
}
