import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent, TnIconComponent } from '@truenas/ui-components';
import { MatButton } from '@angular/material/button';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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
    TnIconComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class DeviceDetailsComponent {
  private translate = inject(TranslateService);
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
