import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, of } from 'rxjs';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDevice, ContainerNicDevice } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddNicMenuComponent } from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/add-nic-menu/add-nic-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/containers/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@UntilDestroy()
@Component({
  selector: 'ix-container-nic-devices',
  templateUrl: './container-nic-devices.component.html',
  styleUrls: ['./container-nic-devices.component.scss'],
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
  ],
})
export class ContainerNicDevicesComponent {
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
  private translate = inject(TranslateService);
  private api = inject(ApiService);

  protected readonly hasPendingInterfaceChanges = toSignal(
    this.api.call('interface.has_pending_changes').pipe(catchError(() => of(false))),
  );

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly isContainerRunning = computed(() => {
    const container = this.containersStore.selectedContainer();
    return container?.status.state === ContainerStatus.Running;
  });

  protected readonly shownDevices = computed<ContainerNicDevice[]>(() => {
    return this.devicesStore.devices().filter((device): device is ContainerNicDevice => {
      return device.dtype === ContainerDeviceType.Nic;
    });
  });

  protected getDeviceDescription(device: ContainerDevice): string {
    return getDeviceDescription(this.translate, device);
  }
}
