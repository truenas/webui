import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDev } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-device-node',
  templateUrl: './device-node.component.html',
  styleUrls: ['./device-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceNodeComponent {
  @Input() device: VDev;

  get isDisk(): boolean {
    return this.device.type === VDevType.Disk;
  }

  get isMirror(): boolean {
    return this.device.type === VDevType.Mirror;
  }

  get isDeviceGroup(): boolean {
    return !this.device?.type;
  }

  get name(): string {
    if (this.isMirror) {
      return this.device.name;
    }
    if (this.isDisk) {
      return this.device.disk;
    }
    if (this.isDeviceGroup) {
      return this.translate.instant('{group} VDEVs', { group: this.device.guid });
    }

    return this.device.guid;
  }

  get errors(): number {
    if (this.isMirror) {
      return this.device.children.reduce((errors, vdev) => {
        return errors
          + (vdev.stats?.read_errors || 0)
          + (vdev.stats?.write_errors || 0)
          + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }
    return (this.device.stats?.read_errors || 0)
     + (this.device.stats?.write_errors || 0)
     + (this.device.stats?.checksum_errors || 0);
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) { }
}
