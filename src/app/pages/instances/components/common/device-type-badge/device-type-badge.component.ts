import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ContainerDeviceType, containerDeviceTypeLabels } from 'app/enums/container.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { getStorageDeviceIcon } from 'app/pages/instances/utils/storage-device-icon.utils';

/**
 * Displays a device type badge with icon and label
 * Used to visually distinguish different storage and device types
 */
@Component({
  selector: 'ix-device-type-badge',
  templateUrl: './device-type-badge.component.html',
  styleUrls: ['./device-type-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatTooltip,
    TranslateModule,
  ],
})
export class DeviceTypeBadgeComponent {
  readonly deviceType = input.required<ContainerDeviceType>();
  readonly showLabel = input<boolean>(true);

  protected readonly icon = computed(() => {
    return getStorageDeviceIcon(this.deviceType());
  });

  protected readonly label = computed(() => {
    return containerDeviceTypeLabels.get(this.deviceType()) || this.deviceType();
  });

  protected readonly deviceClass = computed(() => {
    const deviceType = this.deviceType();
    switch (deviceType) {
      case ContainerDeviceType.Disk:
        return 'device-disk';
      case ContainerDeviceType.Raw:
        return 'device-raw';
      case ContainerDeviceType.Filesystem:
        return 'device-filesystem';
      case ContainerDeviceType.Usb:
        return 'device-usb';
      case ContainerDeviceType.Nic:
        return 'device-nic';
      default:
        return 'device-unknown';
    }
  });
}
