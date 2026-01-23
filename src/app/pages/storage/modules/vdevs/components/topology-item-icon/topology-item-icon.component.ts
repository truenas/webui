import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { tnIconMarker } from '@truenas/ui-components';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { isVdev, VDevItem } from 'app/interfaces/storage.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-topology-item-icon',
  templateUrl: './topology-item-icon.component.html',
  styleUrls: ['./topology-item-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxIconComponent],
})
export class TopologyItemIconComponent {
  readonly topologyItem = input.required<VDevItem>();
  readonly disk = input.required<Disk>();

  protected readonly diskIcon = computed(() => {
    if (!this.disk()) {
      return '';
    }
    if (isVdev(this.topologyItem())) {
      if (this.disk().type === DiskType.Hdd) {
        return tnIconMarker('hdd-mirror', 'custom');
      }
      if (this.disk().type === DiskType.Ssd) {
        return tnIconMarker('ssd-mirror', 'custom');
      }
    } else {
      if (this.disk().type === DiskType.Hdd) {
        return tnIconMarker('hdd', 'custom');
      }
      if (this.disk().type === DiskType.Ssd) {
        return tnIconMarker('ssd', 'custom');
      }
    }
    return '';
  });
}
