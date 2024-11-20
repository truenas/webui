import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardEnclosureSlot, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';
import { EnclosureSideComponent } from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import { EnclosureSideSwitchComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side-switch/enclosure-side-switch.component';
import { PoolsLegendComponent } from 'app/pages/system/enclosure/components/pools-legend/pools-legend.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { makePoolTintFunction } from 'app/pages/system/enclosure/utils/make-pool-tint-function.utils';
import { DiskTopologyDescriptionComponent } from './disk-topology-description/disk-topology-description.component';
import { VdevDisksLegendComponent } from './vdev-disks-legend/vdev-disks-legend.component';

@Component({
  selector: 'ix-pools-view',
  templateUrl: './pools-view.component.html',
  styleUrl: '../_enclosure-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    DiskTopologyDescriptionComponent,
    EnclosureSideComponent,
    EnclosureSideSwitchComponent,
    VdevDisksLegendComponent,
    PoolsLegendComponent,
    TranslateModule,
  ],
})
export class PoolsViewComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly selectedSlot = this.store.selectedSlot;
  readonly selectedSide = this.store.selectedSide;
  readonly poolColors = this.store.poolColors;
  readonly hasMoreThanOneSide = this.store.hasMoreThanOneSide;

  constructor(
    private store: EnclosureStore,
  ) {}

  protected onSlotSelected(slot: DashboardEnclosureSlot | null): void {
    this.store.selectSlot(slot ? slot.drive_bay_number : null);
  }

  readonly slotTintFn = computed(() => {
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
