import { EnclosureOldElements } from 'app/interfaces/enclosure-old.interface';

export interface ViewConfig {
  name: keyof EnclosureOldElements;
  alias: string; // Used for tab menu label
  icon: string;
  enclosureIndex: number;
  elementIndex?: number;
  showInNavbar: boolean;
}
