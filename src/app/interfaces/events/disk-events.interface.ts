import { EnclosureView } from 'app/interfaces/enclosure.interface';
import { DriveTray } from 'app/pages/system/view-enclosure/classes/drivetray';

export interface DriveSelectedEvent {
  name: 'DriveSelected';
  sender: unknown;
  data: DriveTray;
}

export interface CanvasExtractEvent {
  name: 'CanvasExtract';
  sender: unknown;
  data: EnclosureView;
}
