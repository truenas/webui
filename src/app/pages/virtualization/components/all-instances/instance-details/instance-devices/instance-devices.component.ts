import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import {
  AddDeviceMenuComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/add-device-menu/add-device-menu.component';
import {
  DeleteDeviceButtonComponent,
} from 'app/pages/virtualization/components/common/delete-device-button/delete-device-button.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';

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
    DeleteDeviceButtonComponent,
    AddDeviceMenuComponent,
  ],
})
export class InstanceDevicesComponent {
  protected readonly isLoadingDevices = this.deviceStore.isLoading;

  protected readonly shownDevices = computed(() => {
    return this.deviceStore.devices().filter((device) => {
      return [VirtualizationDeviceType.Usb, VirtualizationDeviceType.Gpu].includes(device.dev_type);
    });
  });

  constructor(
    private deviceStore: VirtualizationDevicesStore,
  ) {}

  protected getDeviceDescription(device: VirtualizationDevice): string {
    // TODO: Add type back after https://ixsystems.atlassian.net/browse/NAS-132543
    // const type = virtualizationDeviceTypeLabels.has(device.dev_type)
    //   ? virtualizationDeviceTypeLabels.get(device.dev_type)
    //   : device.dev_type;

    return device.description;
  }
}
