import { SelectedEnclosureSlot } from 'app/interfaces/enclosure.interface';

export interface LabelDrivesEvent {
  name: 'LabelDrives';
  sender: unknown;
  data: SelectedEnclosureSlot;
}
