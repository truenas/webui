import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { vmDeviceTypeLabels } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TestDirective,
    TranslateModule,
  ],
})
export class DeviceDetailsComponent {
  private translate = inject(TranslateService);
  protected dialogRef = inject<DialogRef<unknown, DeviceDetailsComponent>>(DialogRef);
  protected device = inject<VmDevice>(DIALOG_DATA);

  attributes: [string, unknown][] = [];

  constructor() {
    const device = this.device;

    this.attributes = Object.entries(device.attributes).filter(([key]) => key !== 'dtype');
  }

  get title(): string {
    const deviceTypeLabel = this.translate.instant(
      vmDeviceTypeLabels.get(this.device.attributes.dtype) ?? this.device.attributes.dtype,
    );
    return this.translate.instant('Details for {vmDevice}', {
      vmDevice: `${deviceTypeLabel} ${this.device.id}`,
    });
  }
}
