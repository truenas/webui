import { MediaChange } from '@angular/flex-layout';

export interface MediaChangeEvent {
  name: 'MediaChange';
  sender: unknown;
  data: MediaChange;
}
