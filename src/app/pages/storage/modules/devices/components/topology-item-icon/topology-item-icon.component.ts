import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { isVdev, TopologyItem } from 'app/interfaces/storage.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-topology-item-icon',
  templateUrl: './topology-item-icon.component.html',
  styleUrls: ['./topology-item-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxIconComponent],
})
export class TopologyItemIconComponent {
  readonly topologyItem = input.required<TopologyItem>();
  readonly disk = input.required<Disk>();

  protected readonly diskIcon = computed(() => {
    if (!this.disk()) {
      return '';
    }
    if (isVdev(this.topologyItem())) {
      if (this.disk().type === DiskType.Hdd) {
        return 'ix:hdd_mirror';
      }
      if (this.disk().type === DiskType.Ssd) {
        return 'ix:ssd_mirror';
      }
    } else {
      if (this.disk().type === DiskType.Hdd) {
        return 'ix:hdd';
      }
      if (this.disk().type === DiskType.Ssd) {
        return 'ix:ssd';
      }
    }
    return '';
  });
}
