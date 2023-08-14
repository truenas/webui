import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';

export interface UntypedEvent {
  name: string;
  sender?: unknown;
  data?: unknown;
}

export type CoreEvent = UntypedEvent | LabelDrivesEvent;
