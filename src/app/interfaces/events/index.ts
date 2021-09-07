import { AnimateEvent } from 'app/interfaces/events/animate-event.interface';
import { AuthenticatedEvent } from 'app/interfaces/events/authenticated-event.interface';
import { CpuStatsEvent } from 'app/interfaces/events/cpu-stats-event.interface';
import { DiskDataEvent, DisksRequestEvent } from 'app/interfaces/events/disk-data-event.interface';
import { EnclosureDataEvent } from 'app/interfaces/events/enclosure-data-event.interface';
import { ForceSidenavEvent } from 'app/interfaces/events/force-sidenav-event.interface';
import { MediaChangeEvent } from 'app/interfaces/events/media-change-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { NicInfoEvent } from 'app/interfaces/events/nic-info-event.interface';
import { PoolDataEvent } from 'app/interfaces/events/pool-data-event.interface';
import { PseudoRouteChangeEvent } from 'app/interfaces/events/pseudo-route-change-event.interface';
import { ResilverEvent } from 'app/interfaces/events/resilver-event.interface';
import { ScrollToEvent } from 'app/interfaces/events/scroll-to-event.interface';
import { SidenavStatusEvent } from 'app/interfaces/events/sidenav-status-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import {
  ThemeChangedEvent,
  ThemeChangeRequestEvent, ThemeDataEvent, ThemeDataRequestEvent,
  ThemeListsChangedEvent,
} from 'app/interfaces/events/theme-events.interface';
import { TreeTableGlobalFilterEvent } from 'app/interfaces/events/tree-table-global-filter-event.interface';
import { UpdateCheckedEvent } from 'app/interfaces/events/update-checked-event.interface';
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
  | NicInfoEvent
  | SysInfoEvent
  | UntypedEvent
  | CpuStatsEvent
  | UpdateCheckedEvent
  | UserDataEvent
  | EnclosureDataEvent
  | ResilverEvent
  | DisksRequestEvent
  | DiskDataEvent
  | ScrollToEvent
  | ThemeListsChangedEvent
  | ForceSidenavEvent
  | UserPreferencesChangedEvent
  | UserPreferencesReadyEvent
  | SidenavStatusEvent
  | AnimateEvent
  | PseudoRouteChangeEvent
  | ThemeChangedEvent
  | ThemeChangeRequestEvent
  | ThemeDataRequestEvent
  | ThemeDataEvent
  | TreeTableGlobalFilterEvent
  | MediaChangeEvent
  | NetworkInterfacesChangedEvent
  | AuthenticatedEvent
  | UserPreferencesEvent;
