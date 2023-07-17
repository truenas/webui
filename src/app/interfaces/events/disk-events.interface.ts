import { EnclosureView } from 'app/interfaces/enclosure.interface';
import { DriveTray } from 'app/pages/system/view-enclosure/classes/drivetray';
import { Temperature } from 'app/services/disk-temperature.service';

export interface DiskTemperaturesEvent {
  name: 'DiskTemperatures';
  sender: unknown;
  data: Temperature;
}

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
