import { createAction, props } from '@ngrx/store';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';

export const rebootInfoLoaded = createAction(
  '[Reboot Info API] Reboot Info Loaded',
  props<{
    thisNodeInfo: SystemRebootInfo | null;
    otherNodeInfo: SystemRebootInfo | null;
  }>(),
);
