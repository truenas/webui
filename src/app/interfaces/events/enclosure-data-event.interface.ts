import { Enclosure } from 'app/interfaces/enclosure.interface';

export interface EnclosureDataEvent {
  name: 'EnclosureData';
  sender: unknown;
  data: Enclosure[];
}
