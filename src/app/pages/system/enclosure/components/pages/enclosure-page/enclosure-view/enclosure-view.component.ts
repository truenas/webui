import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { DashboardEnclosure, DashboardEnclosureSlot, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { diskStatusTint } from 'app/pages/system/enclosure/utils/disk-status-tint.utils';
import { makePoolTintFunction } from 'app/pages/system/enclosure/utils/make-pool-tint-function.utils';

@Component({
  selector: 'ix-enclosure-view',
  templateUrl: './enclosure-view.component.html',
  styleUrl: './enclosure-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureViewComponent {
  readonly enclosure = input.required<DashboardEnclosure>();

  readonly selectedView = this.store.selectedView;
  readonly selectedSlot = this.store.selectedSlot;
  readonly selectedEnclosureSlots = this.store.selectedEnclosureSlots;
  readonly selectedSide = this.store.selectedSide;
  readonly poolColors = this.store.poolColors;

  constructor(
    private store: EnclosureStore,
  ) {}

  protected onSlotSelected(slot: DashboardEnclosureSlot): void {
    this.store.selectSlot(slot);
  }

  readonly slotTintFn = computed(() => {
    if (this.selectedView() === EnclosureView.DiskStatus) {
      return diskStatusTint;
    }

    return makePoolTintFunction(this.poolColors());
  });

  readonly poolColor = computed(() => {
    const poolName = this.selectedSlot()?.pool_info?.pool_name;
    if (!poolName) {
      return null;
    }

    const poolColors = this.poolColors();
    return poolColors[poolName];
  });

  protected onVdevDiskClicked(vdevDisk: EnclosureVdevDisk): void {
    this.store.selectSlotByVdevDisk(vdevDisk);
  }
}
