import { TranslateService } from '@ngx-translate/core';
import { ContainerDeviceType, containerDeviceTypeLabels } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';

export function getDeviceDescription(translate: TranslateService, device: ContainerDevice): string {
  const typeLabel = translate.instant(containerDeviceTypeLabels.get(device.dtype) || device.dtype);

  if (device.dtype === ContainerDeviceType.Nic) {
    const nicMac = device.mac ? device.mac : translate.instant('Default Mac Address');
    const nicAttach = device.nic_attach || device.parent || translate.instant('Unknown');
    const nicName = device.name || nicAttach;
    return `${typeLabel}: ${nicName} (${nicMac})`;
  }

  return `${typeLabel}: ${device.description}`;
}
