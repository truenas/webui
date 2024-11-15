import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType, virtualizationDeviceTypeLabels } from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    MatIconButton,
    TestDirective,
    IxIconComponent,
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

    // TODO: Get better names.
    const description = device.name;

    return `${type}: ${description}`;
  }
}
