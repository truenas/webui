import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-icon',
  templateUrl: './disk-icon.component.html',
  styleUrls: ['./disk-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskIconComponent {
  @Input() vdev: VDev;
  @Input() disk: Disk;

  get diskIcon(): string {
    if (this.vdev.children.length) {
      if (this.disk.type === DiskType.Hdd) {
        return 'ix-hdd-mirror';
      }
      if (this.disk.type === DiskType.Ssd) {
        return 'ix-ssd-mirror';
      }
    } else {
      if (this.disk.type === DiskType.Hdd) {
        return 'ix-hdd';
      }
      if (this.disk.type === DiskType.Ssd) {
        return 'ix-ssd';
      }
    }
    return '';
  }
}
