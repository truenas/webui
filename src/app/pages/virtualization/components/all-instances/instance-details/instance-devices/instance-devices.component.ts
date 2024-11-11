import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType, virtualizationDeviceTypeLabels } from 'app/enums/virtualization.enum';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

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
    MapValuePipe,
  ],
})
export class InstanceDevicesComponent {
  instance = input.required<VirtualizationInstance>();
  devices = input.required<VirtualizationDevice[]>();
  isLoadingDevices = input.required();

  protected readonly shownDevices = computed(() => {
    return this.devices().filter((device) => {
      return [VirtualizationDeviceType.Usb, VirtualizationDeviceType.Gpu].includes(device.dev_type);
    });
  });

  protected getDeviceDescription(device: VirtualizationDevice): string {
    const type = virtualizationDeviceTypeLabels.has(device.dev_type)
      ? virtualizationDeviceTypeLabels.get(device.dev_type)
      : device.dev_type;

    let description = '';

    if (device.dev_type === VirtualizationDeviceType.Usb) {
      description = device.name;
    }

    return `${type}: ${description}`;
  }
}
