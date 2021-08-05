import { CpuStatsEvent } from 'app/interfaces/events/cpu-stats-event.interface';
import { DiskDataEvent } from 'app/interfaces/events/disk-data-event.interface';
import { EnclosureDataEvent } from 'app/interfaces/events/enclosure-data-event.interface';
import { NicInfoEvent } from 'app/interfaces/events/nic-info-event.interface';
import { PoolDataEvent } from 'app/interfaces/events/pool-data-event.interface';
import { RealtimeStatsEvent } from 'app/interfaces/events/realtime-stats-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { UpdateCheckedEvent } from 'app/interfaces/events/update-checked-event.interface';
import { UserDataEvent } from 'app/interfaces/events/user-data-event.interface';

export interface UntypedEvent {
  name: string;
  sender?: any;
  data?: any;
}

export type CoreEvent =
  | RealtimeStatsEvent
  | PoolDataEvent
  | NicInfoEvent
  | SysInfoEvent
  | UntypedEvent
  | CpuStatsEvent
  | UpdateCheckedEvent
  | UserDataEvent
  | EnclosureDataEvent
  | DiskDataEvent;
