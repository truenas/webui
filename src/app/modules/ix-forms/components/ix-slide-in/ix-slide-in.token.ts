import { InjectionToken } from '@angular/core';
import { Subject } from 'rxjs';
import { ChainedComponentRef } from 'app/services/ix-chained-slide-in.service';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SLIDE_IN_DATA = new InjectionToken<string>('SLIDE_IN_DATA');
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CHAINED_COMPONENT_REF = new InjectionToken<Subject<ChainedComponentRef>>('CHAINED_SLIDE_IN_REF');
