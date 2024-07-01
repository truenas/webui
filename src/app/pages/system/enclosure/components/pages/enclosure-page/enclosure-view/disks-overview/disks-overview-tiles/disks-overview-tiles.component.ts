import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

@Component({
  selector: 'ix-disks-overview-tiles',
  templateUrl: './disks-overview-tiles.component.html',
  styleUrls: ['./disks-overview-tiles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisksOverviewTilesComponent {
  readonly selectedView = this.enclosureStore.selectedView;
  readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;

  readonly poolsInfo = computed(() => {
    const slots = [...Object.values(this.selectedEnclosure().elements?.['Array Device Slot'] || {})];
    return [
      ...new Map(
        slots.filter((slot) => slot.pool_info).map((slot) => [slot.pool_info.pool_name, slot.pool_info]),
      ).values(),
    ];
  });

  readonly expanders = computed(() => {
    return [...Object.values(this.selectedEnclosure().elements?.['SAS Expander'] || {})];
  });

  readonly unhealthyPoolsInfo = computed(() => {
    return this.poolsInfo().filter((info) => info.disk_status !== EnclosureDiskStatus.Online);
  });

  readonly failedPoolsInfo = computed(() => {
    return this.poolsInfo().filter((info) => {
      return info.disk_read_errors || info.disk_write_errors || info.disk_checksum_errors;
    });
  });

  readonly failsCount = computed(() => {
    return this.failedPoolsInfo().reduce((sum, info) => {
      return sum + info.disk_read_errors || 0 + info.disk_write_errors || 0 + info.disk_checksum_errors || 0;
    }, 0);
  });

  readonly EnclosureView = EnclosureView;

  constructor(
    private enclosureStore: EnclosureStore,
  ) {}

  setCurrentView(viewName: EnclosureView): void {
    this.enclosureStore.selectView(viewName);
  }
}
