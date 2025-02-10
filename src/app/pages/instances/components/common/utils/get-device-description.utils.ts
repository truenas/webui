import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { VirtualizationDeviceType, virtualizationDeviceTypeLabels } from 'app/enums/virtualization.enum';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';

export function getDeviceDescription(translate: TranslateService, device: VirtualizationDevice): string {
  if (device.dev_type === VirtualizationDeviceType.Tpm) {
    return translate.instant(T('Trusted Platform Module (TPM)'));
  }

  const typeLabel = translate.instant(virtualizationDeviceTypeLabels.get(device.dev_type) || device.dev_type);

  if (device.dev_type === VirtualizationDeviceType.Nic) {
    return `${typeLabel}: ${device.name} (${device.nic_type})`;
  }

  return `${typeLabel}: ${device.description}`;
}
