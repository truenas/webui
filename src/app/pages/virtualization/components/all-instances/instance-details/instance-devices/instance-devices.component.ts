import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType, virtualizationDeviceTypeLabels } from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import {
  DeleteDeviceButtonComponent,
} from 'app/pages/virtualization/components/common/delete-device-button/delete-device-button.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

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
  ],
})
export class InstanceDevicesComponent {
  protected readonly isLoadingDevices = this.instanceStore.isLoadingDevices;

  protected readonly shownDevices = computed(() => {
    return this.instanceStore.selectedInstanceDevices().filter((device) => {
      return [VirtualizationDeviceType.Usb, VirtualizationDeviceType.Gpu].includes(device.dev_type);
    });
  });

  constructor(
    private instanceStore: VirtualizationInstancesStore,
  ) {}

  protected getDeviceDescription(device: VirtualizationDevice): string {
    const type = virtualizationDeviceTypeLabels.has(device.dev_type)
      ? virtualizationDeviceTypeLabels.get(device.dev_type)
      : device.dev_type;

    const description = `${device.description} (${device.product_id})`.replace(`${type}:`, '').trim();

    return `${type}: ${description}`;
  }
}
