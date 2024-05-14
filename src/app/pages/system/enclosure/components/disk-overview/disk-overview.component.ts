import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-disk-overview',
  templateUrl: './disk-overview.component.html',
  styleUrls: ['./disk-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskOverviewComponent {
  slot = input.required<DashboardEnclosureSlot | null>();

  get diskName(): string {
    return this.slot().dev || this.slot().descriptor;
  }

  constructor(
    private enclosureStore: EnclosureStore,
  ) {}

  closeDetails(): void {
    this.enclosureStore.selectSlot(null);
  }
}
