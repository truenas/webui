import { InputSignal } from '@angular/core';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export interface EnclosureComponent {
  enclosure: InputSignal<DashboardEnclosure>;
}
