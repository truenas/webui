import { TranslateService } from '@ngx-translate/core';
import { ContainerDeviceType, containerDeviceTypeLabels } from 'app/enums/container.enum';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { ContainerDevice } from 'app/interfaces/container.interface';

export function getDeviceDescription(translate: TranslateService, device: ContainerDevice): string {
  switch (device.dtype) {
    case ContainerDeviceType.Nic: {
      const nicMac = device.mac
        ? device.mac
        : translate.instant(instancesHelptext.deviceDescriptions.defaultMacAddress);
      const nicAttach = device.nic_attach || translate.instant(instancesHelptext.deviceDescriptions.unknown);
      const nicName = device.name || nicAttach;
      return `${nicName} (${nicMac})`;
    }

    case ContainerDeviceType.Disk:
    case ContainerDeviceType.Raw: {
      // Disk/Raw are presented as block devices
      const path = device.path || translate.instant(instancesHelptext.deviceDescriptions.unknownPath);
      const diskType = device.type ? ` (${device.type})` : '';
      return `${path}${diskType}`;
    }

    case ContainerDeviceType.Filesystem: {
      // Filesystem is a bind mount from host to container
      const source = device.source || translate.instant(instancesHelptext.deviceDescriptions.unknownSource);
      const target = device.target || translate.instant(instancesHelptext.deviceDescriptions.unknownTarget);
      return `${source} → ${target}`;
    }

    default: {
      const typeLabel = translate.instant(containerDeviceTypeLabels.get(device.dtype) || device.dtype);
      return `${typeLabel}: ${device.description}`;
    }
  }
}
