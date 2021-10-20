import { Enclosure } from 'app/interfaces/enclosure.interface';

export interface EnclosureDataEvent {
  name: 'EnclosureData';
  sender: unknown;
  data: Enclosure[];
}

export interface EnclosureLabelChangedEvent {
  name: 'EnclosureLabelChanged';
  sender: unknown;
  data: {
    label: string;
    index: number;
    id: string;
  };
}
