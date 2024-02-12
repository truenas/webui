import { ValueProvider } from '@angular/core';
import _ from 'lodash';
import { DeepPartial } from 'utility-types';
import { WINDOW } from 'app/helpers/window.helper';

export function mockWindow(overrides: DeepPartial<Window> = {}): ValueProvider {
  const baseWindow = {
    location: {
      protocol: 'http:',
    },
    open: jest.fn(),
  } as DeepPartial<Window>;

  return {
    provide: WINDOW,
    useValue: _.merge(baseWindow, overrides),
  };
}
