import { SystemUpdate } from 'app/interfaces/system-update.interface';

export interface UpdateCheckedEvent {
  name: 'UpdateChecked';
  sender: unknown;
  data: SystemUpdate;
}
