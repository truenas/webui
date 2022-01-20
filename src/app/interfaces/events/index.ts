import { AuthenticatedEvent } from 'app/interfaces/events/authenticated-event.interface';
import { CpuStatsEvent } from 'app/interfaces/events/cpu-stats-event.interface';
import { DisksDataEvent, DisksRequestEvent } from 'app/interfaces/events/disks-data-event.interface';
import { EnclosureLabelChangedEvent } from 'app/interfaces/events/enclosure-events.interface';
import { ForceSidenavEvent } from 'app/interfaces/events/force-sidenav-event.interface';
import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { MediaChangeEvent } from 'app/interfaces/events/media-change-event.interface';
import { MemoryStatsEvent } from 'app/interfaces/events/memory-stats-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { PoolDataEvent } from 'app/interfaces/events/pool-data-event.interface';
import { PseudoRouteChangeEvent } from 'app/interfaces/events/pseudo-route-change-event.interface';
import { ResilveringEvent } from 'app/interfaces/events/resilvering-event.interface';
import { SidenavStatusEvent } from 'app/interfaces/events/sidenav-status-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import {
  ThemeChangedEvent,
  ThemeChangeRequestEvent, ThemeDataEvent, ThemeDataRequestEvent,
  ThemeListsChangedEvent,
} from 'app/interfaces/events/theme-events.interface';
import { TreeTableGlobalFilterEvent } from 'app/interfaces/events/tree-table-global-filter-event.interface';
import { UserDataEvent } from 'app/interfaces/events/user-data-event.interface';
import {
  UserPreferencesChangedEvent, UserPreferencesEvent,
  UserPreferencesReadyEvent,
} from 'app/interfaces/events/user-preferences-event.interface';

export interface UntypedEvent {
  name: string;
  sender?: any;
  data?: any;
}

export type CoreEvent =
  | PoolDataEvent
  | SysInfoEvent
  | UntypedEvent
  | CpuStatsEvent
  | UserDataEvent
  | ResilveringEvent
  | DisksRequestEvent
  | DisksDataEvent
  | ThemeListsChangedEvent
  | ForceSidenavEvent
  | UserPreferencesChangedEvent
  | UserPreferencesReadyEvent
  | SidenavStatusEvent
  | PseudoRouteChangeEvent
  | ThemeChangedEvent
  | ThemeChangeRequestEvent
  | ThemeDataRequestEvent
  | ThemeDataEvent
  | TreeTableGlobalFilterEvent
  | MediaChangeEvent
  | NetworkInterfacesChangedEvent
  | AuthenticatedEvent
  | UserPreferencesEvent
  | LabelDrivesEvent
  | MemoryStatsEvent
  | EnclosureLabelChangedEvent;
