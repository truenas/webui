import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { vmDeviceTypeLabels } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    IxIconComponent,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
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
