import { InjectionToken } from '@angular/core';
import { Subject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SLIDE_IN_DATA = new InjectionToken<string>('SLIDE_IN_DATA');
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SLIDE_IN_CLOSER = new InjectionToken<Subject<unknown>>('SLIDE_IN_CLOSER');