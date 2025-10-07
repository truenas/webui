import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
} from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddNicMenuComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-nics/add-nic-menu/add-nic-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';

@UntilDestroy()
@Component({
  selector: 'ix-instance-nics',
  templateUrl: './instance-nics.component.html',
  styleUrls: ['./instance-nics.component.scss'],
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
export class InstanceNicsComponent {
  private devicesStore = inject(VirtualizationDevicesStore);
  private translate = inject(TranslateService);
  private api = inject(ApiService);

  protected readonly hasPendingInterfaceChanges = toSignal(this.api.call('interface.has_pending_changes'));
  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly shownDevices = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return device.dev_type === VirtualizationDeviceType.Nic && !!device.nic_type;
    });
  });

  protected getDeviceDescription(device: VirtualizationDevice): string {
    return getDeviceDescription(this.translate, device);
  }
}
