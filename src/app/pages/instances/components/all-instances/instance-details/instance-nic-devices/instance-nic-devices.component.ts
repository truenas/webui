import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddNicMenuComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-nic-devices/add-nic-menu/add-nic-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import {
  DeviceTypeBadgeComponent,
} from 'app/pages/instances/components/common/device-type-badge/device-type-badge.component';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-instance-nic-devices',
  templateUrl: './instance-nic-devices.component.html',
  styleUrls: ['./instance-nic-devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    TranslateModule,
    MatTooltipModule,
    MatCardContent,
    NgxSkeletonLoaderModule,
    DeviceActionsMenuComponent,
    AddNicMenuComponent,
    DeviceTypeBadgeComponent,
  ],
})
export class InstanceNicDevicesComponent {
  private devicesStore = inject(ContainerDevicesStore);
  private instancesStore = inject(ContainerInstancesStore);
  private translate = inject(TranslateService);
  private api = inject(ApiService);

  protected readonly hasPendingInterfaceChanges = toSignal(this.api.call('interface.has_pending_changes'));
  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly isContainerRunning = computed(() => {
    const instance = this.instancesStore.selectedInstance();
    return instance?.status.state === ContainerStatus.Running;
  });

  protected readonly shownDevices = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return device.dtype === ContainerDeviceType.Nic;
    });
  });

  protected getDeviceDescription(device: ContainerDevice): string {
    return getDeviceDescription(this.translate, device);
  }
}
