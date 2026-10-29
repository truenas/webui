import { TranslateService } from '@ngx-translate/core';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { containersHelptext } from 'app/helptext/containers/containers';
import { ContainerDevice } from 'app/interfaces/container.interface';

export function getDeviceDescription(translate: TranslateService, device: ContainerDevice): string {
  switch (device.dtype) {
    case ContainerDeviceType.Nic: {
      const nicMac = device.mac
        ? device.mac
        : translate.instant(containersHelptext.deviceDescriptions.defaultMacAddress);
      // NICs stored before middleware recorded the attachment have none, and run as macvlan
      // on the interface carrying the default route.
      const nicAttach = device.nic_attach
        || translate.instant(containersHelptext.deviceDescriptions.defaultRouteMacvlan);
      return `${nicAttach} (${nicMac})`;
    }

    case ContainerDeviceType.Filesystem: {
      // Filesystem is a bind mount from host to container
      const source = device.source || translate.instant(containersHelptext.deviceDescriptions.unknownSource);
      const target = device.target || translate.instant(containersHelptext.deviceDescriptions.unknownTarget);
      return `${source} → ${target}`;
    }

    case ContainerDeviceType.Usb: {
      if (device.usb) {
        return `USB ${device.usb.vendor_id}:${device.usb.product_id}`;
      }
      return device.device || translate.instant(containersHelptext.deviceDescriptions.unknown);
    }

    case ContainerDeviceType.Gpu: {
      return `${device.gpu_type} GPU (${device.pci_address})`;
    }

    default: {
      // This should never happen due to TypeScript exhaustiveness checking
      const exhaustiveCheck: never = device;
      return String(exhaustiveCheck);
    }
  }
}
