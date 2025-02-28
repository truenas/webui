import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import {
  AddDeviceMenuComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-devices/add-device-menu/add-device-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';

@UntilDestroy()
@Component({
  selector: 'ix-instance-devices',
  templateUrl: './instance-devices.component.html',
  styleUrls: ['./instance-devices.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    TranslateModule,
    MatCardContent,
    NgxSkeletonLoaderModule,
    DeviceActionsMenuComponent,
    AddDeviceMenuComponent,
  ],
})
export class InstanceDevicesComponent {
  protected readonly isLoadingDevices = this.deviceStore.isLoading;

  protected readonly shownDevices = computed(() => {
    return this.deviceStore.devices().filter((device) => {
      return [
        VirtualizationDeviceType.Usb,
        VirtualizationDeviceType.Gpu,
        VirtualizationDeviceType.Tpm,
        VirtualizationDeviceType.Pci,
      ].includes(device.dev_type);
    });
  });

  constructor(
    private deviceStore: VirtualizationDevicesStore,
    private translate: TranslateService,
  ) {}

  protected getDeviceDescription(device: VirtualizationDevice): string {
    return getDeviceDescription(this.translate, device);
  }
}
