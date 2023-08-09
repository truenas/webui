import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';

export interface UntypedEvent {
  name: string;
  sender?: unknown;
  data?: unknown;
}

export type CoreEvent =
  | UntypedEvent
  | NetworkInterfacesChangedEvent
  | LabelDrivesEvent;
