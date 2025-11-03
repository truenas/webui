import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import {
  ContainerDevice,
} from 'app/interfaces/container.interface';
import {
  AddDeviceMenuComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-devices/add-device-menu/add-device-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-instance-devices',
  templateUrl: './instance-devices.component.html',
  styleUrls: ['./instance-devices.component.scss'],
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
  private devicesStore = inject(VirtualizationDevicesStore);
  private instancesStore = inject(VirtualizationInstancesStore);
  private translate = inject(TranslateService);

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly isContainerRunning = computed(() => {
    const instance = this.instancesStore.selectedInstance();
    return instance?.status.state === ContainerStatus.Running;
  });

  protected readonly shownDevices = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return [
        ContainerDeviceType.Usb,
      ].includes(device.dtype);
    });
  });

  protected getDeviceDescription(device: ContainerDevice): string {
    return getDeviceDescription(this.translate, device);
  }
}
