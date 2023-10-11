import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { vmDeviceTypeLabels } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';

@Component({
  selector: 'ix-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceDetailsComponent {
  attributes: [string, unknown][] = [];

  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) protected device: VmDevice,
  ) {
    this.attributes = Object.entries(device.attributes);
  }

  get title(): string {
    const deviceTypeLabel = this.translate.instant(vmDeviceTypeLabels.get(this.device.dtype) ?? this.device.dtype);
    return this.translate.instant('Details for {vmDevice}', {
      vmDevice: `${deviceTypeLabel} ${this.device.id}`,
    });
  }
}
