import { TranslateService } from '@ngx-translate/core';
import { ContainerDeviceType, containerDeviceTypeLabels } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';

export function getDeviceDescription(translate: TranslateService, device: ContainerDevice): string {
  const typeLabel = translate.instant(containerDeviceTypeLabels.get(device.dtype) || device.dtype);

  if (device.dtype === ContainerDeviceType.Nic) {
    const nicMac = device.mac ? device.mac : 'Default Mac Address';
    return `${typeLabel}: ${device.name} (${device.nic_type}) (${nicMac})`;
  }

  return `${typeLabel}: ${device.description}`;
}
