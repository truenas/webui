import { InputSignal } from '@angular/core';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { OverviewInfo } from 'app/pages/system/enclosure/components/views/enclosure-view/disks-overview/disks-overview.component';

export interface EnclosureComponent {
  enclosure: InputSignal<DashboardEnclosure>;
  selectedSlot: InputSignal<DashboardEnclosureSlot>;
  selectedView: InputSignal<OverviewInfo['name']>;
}
