import { InjectionToken } from '@angular/core';
import { ChainedComponentRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SLIDE_IN_DATA = new InjectionToken<string>('SLIDE_IN_DATA');
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CHAINED_COMPONENT_REF = new InjectionToken<ChainedComponentRef>('CHAINED_COMPONENT_REF');
