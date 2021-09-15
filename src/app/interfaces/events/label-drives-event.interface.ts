import { VDevMetadata } from 'app/core/classes/system-profiler';

export interface LabelDrivesEvent {
  name: 'LabelDrives';
  sender: unknown;
  data: VDevMetadata;
}
