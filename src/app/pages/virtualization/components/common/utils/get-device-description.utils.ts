import { TranslateService } from '@ngx-translate/core';
import { virtualizationDeviceTypeLabels } from 'app/enums/virtualization.enum';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';

export function getDeviceDescription(translate: TranslateService, device: VirtualizationDevice): string {
  const typeLabel = virtualizationDeviceTypeLabels.has(device.dev_type)
    ? translate.instant(virtualizationDeviceTypeLabels.get(device.dev_type))
    : device.dev_type;

  return `${typeLabel}: ${device.description}`;
}
