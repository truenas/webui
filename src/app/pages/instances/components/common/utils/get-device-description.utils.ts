import { TranslateService } from '@ngx-translate/core';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { ContainerDevice } from 'app/interfaces/container.interface';

export function getDeviceDescription(translate: TranslateService, device: ContainerDevice): string {
  switch (device.dtype) {
    case ContainerDeviceType.Nic: {
      const nicMac = device.mac
        ? device.mac
        : translate.instant(instancesHelptext.deviceDescriptions.defaultMacAddress);
      const nicAttach = device.nic_attach || translate.instant(instancesHelptext.deviceDescriptions.unknown);
      return `${nicAttach} (${nicMac})`;
    }

    case ContainerDeviceType.Filesystem: {
      // Filesystem is a bind mount from host to container
      const source = device.source || translate.instant(instancesHelptext.deviceDescriptions.unknownSource);
      const target = device.target || translate.instant(instancesHelptext.deviceDescriptions.unknownTarget);
      return `${source} → ${target}`;
    }

    case ContainerDeviceType.Usb: {
      if (device.usb) {
        return `USB ${device.usb.vendor_id}:${device.usb.product_id}`;
      }
      return device.device || translate.instant(instancesHelptext.deviceDescriptions.unknown);
    }

    default: {
      // This should never happen due to TypeScript exhaustiveness checking
      const exhaustiveCheck: never = device;
      return String(exhaustiveCheck);
    }
  }
}
