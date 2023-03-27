import { CpuStatsEvent } from 'app/interfaces/events/cpu-stats-event.interface';
import { EnclosureLabelChangedEvent } from 'app/interfaces/events/enclosure-events.interface';
import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { MemoryStatsEvent } from 'app/interfaces/events/memory-stats-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { NetworkTrafficEvent } from 'app/interfaces/events/network-traffic-event.interface';
import { TreeTableGlobalFilterEvent } from 'app/interfaces/events/tree-table-global-filter-event.interface';

export interface UntypedEvent {
  name: string;
  sender?: unknown;
  data?: unknown;
}

export type CoreEvent =
  | UntypedEvent
  | CpuStatsEvent
  | TreeTableGlobalFilterEvent
  | NetworkInterfacesChangedEvent
  | LabelDrivesEvent
  | MemoryStatsEvent
  | EnclosureLabelChangedEvent
  | NetworkTrafficEvent;
