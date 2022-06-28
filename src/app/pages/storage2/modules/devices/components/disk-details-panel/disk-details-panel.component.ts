import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDev } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsPanelComponent {
  @Input() disk: VDev;

  get ownName(): string {
    if (this.isDisk) {
      return this.disk.disk;
    }

    if (this.isMirror) {
      return this.disk.name;
    }

    return this.disk.guid;
  }

  get isDisk(): boolean {
    return this.disk.type === VDevType.Disk;
  }

  get isMirror(): boolean {
    return this.disk.type === VDevType.Mirror;
  }

  get isDeviceGroup(): boolean {
    return !this.disk?.type;
  }
}
