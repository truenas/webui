import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk, isVdev, TopologyItem } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-topology-item-icon',
  templateUrl: './topology-item-icon.component.html',
  styleUrls: ['./topology-item-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopologyItemIconComponent {
  @Input() topologyItem: TopologyItem;
  @Input() disk: Disk;

  get diskIcon(): string {
    if (!this.disk) {
      return '';
    }
    if (isVdev(this.topologyItem)) {
      if (this.disk.type === DiskType.Hdd) {
        return 'ix:hdd_mirror';
      }
      if (this.disk.type === DiskType.Ssd) {
        return 'ix:ssd_mirror';
      }
    } else {
      if (this.disk.type === DiskType.Hdd) {
        return 'ix:hdd';
      }
      if (this.disk.type === DiskType.Ssd) {
        return 'ix:ssd';
      }
    }
    return '';
  }
}
