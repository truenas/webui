import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-disks-overview-details',
  templateUrl: './disks-overview-details.component.html',
  styleUrls: ['./disks-overview-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisksOverviewDetailsComponent {
  readonly selectedSlot = this.enclosureStore.selectedSlot;

  constructor(
    private enclosureStore: EnclosureStore,
  ) {}
}
