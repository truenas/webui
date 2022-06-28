import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDev } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-device-icon',
  templateUrl: './device-icon.component.html',
  styleUrls: ['./device-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceIconComponent {
  @Input() device: VDev;

  get isDisk(): boolean {
    return this.device.type === VDevType.Disk;
  }

  get isMirror(): boolean {
    return this.device.type === VDevType.Mirror;
  }
}
