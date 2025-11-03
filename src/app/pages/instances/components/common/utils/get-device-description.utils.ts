import { TranslateService } from '@ngx-translate/core';
import { VirtualizationDeviceType, virtualizationDeviceTypeLabels } from 'app/enums/virtualization.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';

export function getDeviceDescription(translate: TranslateService, device: ContainerDevice): string {
  const typeLabel = translate.instant(virtualizationDeviceTypeLabels.get(device.dev_type) || device.dev_type);

  if (device.dev_type === VirtualizationDeviceType.Nic) {
    const nicMac = device.mac ? device.mac : 'Default Mac Address';
    return `${typeLabel}: ${device.name} (${device.nic_type}) (${nicMac})`;
  }

  return `${typeLabel}: ${device.description}`;
}
