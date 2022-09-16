import { AuthenticatedEvent } from 'app/interfaces/events/authenticated-event.interface';
import { CpuStatsEvent } from 'app/interfaces/events/cpu-stats-event.interface';
import { EnclosureLabelChangedEvent } from 'app/interfaces/events/enclosure-events.interface';
import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { MediaChangeEvent } from 'app/interfaces/events/media-change-event.interface';
import { MemoryStatsEvent } from 'app/interfaces/events/memory-stats-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { SidenavStatusEvent } from 'app/interfaces/events/sidenav-status-event.interface';
import { TreeTableGlobalFilterEvent } from 'app/interfaces/events/tree-table-global-filter-event.interface';

export interface UntypedEvent {
  name: string;
  sender?: unknown;
  data?: any;
}

export type CoreEvent =
  | UntypedEvent
  | CpuStatsEvent
  | SidenavStatusEvent
  | TreeTableGlobalFilterEvent
  | MediaChangeEvent
  | NetworkInterfacesChangedEvent
  | AuthenticatedEvent
  | LabelDrivesEvent
  | MemoryStatsEvent
  | EnclosureLabelChangedEvent;
