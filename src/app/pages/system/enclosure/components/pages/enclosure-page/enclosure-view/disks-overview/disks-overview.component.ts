import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-disks-overview',
  templateUrl: './disks-overview.component.html',
  styleUrls: ['./disks-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisksOverviewComponent {
  readonly selectedSlot = this.enclosureStore.selectedSlot;

  get diskName(): string {
    return this.selectedSlot().dev || this.selectedSlot().descriptor;
  }

  constructor(
    private enclosureStore: EnclosureStore,
  ) {}

  closeDetails(): void {
    this.enclosureStore.selectSlot(null);
  }
}
