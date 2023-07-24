import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { NetworkTrafficEvent } from 'app/interfaces/events/network-traffic-event.interface';

export interface UntypedEvent {
  name: string;
  sender?: unknown;
  data?: unknown;
}

export type CoreEvent =
  | UntypedEvent
  | NetworkInterfacesChangedEvent
  | LabelDrivesEvent
  | NetworkTrafficEvent;
