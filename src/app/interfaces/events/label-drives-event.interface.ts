import { VDevMetadata } from 'app/pages/system/view-enclosure/classes/system-profiler';

export interface LabelDrivesEvent {
  name: 'LabelDrives';
  sender: unknown;
  data: VDevMetadata;
}
