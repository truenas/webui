import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import { AddNicMenuComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-nics/add-nic-menu/add-nic-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/virtualization/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/virtualization/components/common/utils/get-device-description.utils';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-nics',
  templateUrl: './instance-nics.component.html',
  styleUrls: ['./instance-nics.component.scss'],
  standalone: true,
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
  protected readonly hasPendingInterfaceChanges = toSignal(this.api.call('interface.has_pending_changes'));
  protected readonly isLoadingDevices = this.deviceStore.isLoading;

  protected readonly shownDevices = computed(() => {
    return this.deviceStore.devices().filter((device) => {
      return device.dev_type === VirtualizationDeviceType.Nic && !!device.nic_type;
    });
  });

  constructor(
    private deviceStore: VirtualizationDevicesStore,
    private translate: TranslateService,
    private api: ApiService,
  ) {}

  protected getDeviceDescription(device: VirtualizationDevice): string {
    return getDeviceDescription(this.translate, device);
  }
}
