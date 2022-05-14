import { createAction, props } from '@ngrx/store';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export const systemInfoLoaded = createAction(
  '[System Info API] Loaded',
  props<{ systemInfo: SystemInfo }>(),
);
