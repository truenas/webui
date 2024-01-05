import { EnclosureUiElements } from 'app/interfaces/enclosure.interface';

export interface ViewConfig {
  name: keyof EnclosureUiElements;
  alias: string; // Used for tab menu label
  icon: string;
  enclosureIndex: number;
  elementIndex?: number;
  showInNavbar: boolean;
}
