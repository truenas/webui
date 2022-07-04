import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsPanelComponent {
  @Input() topologyItem: VDev;
  @Input() disk: Disk;

  get ownName(): string {
    if (this.isDisk) {
      return this.topologyItem.disk;
    }

    if (this.isMirror) {
      return this.topologyItem.name;
    }

    return this.topologyItem.guid;
  }

  get isDisk(): boolean {
    return this.topologyItem.type === VDevType.Disk;
  }

  get isMirror(): boolean {
    return this.topologyItem.type === VDevType.Mirror;
  }

  get isDeviceGroup(): boolean {
    return !this.topologyItem?.type;
  }
}
