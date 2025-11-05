import { ContainerDeviceType } from 'app/enums/container.enum';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { iconMarker, MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

/**
 * Icon mapping for storage device types
 * Uses Material Design Icons (mdi) from ix-icon component
 */
export interface StorageDeviceIcon {
  name: MarkedIcon;
  color?: string;
  tooltip: string;
}

/**
 * Get icon configuration for a storage device type
 */
export function getStorageDeviceIcon(deviceType: ContainerDeviceType): StorageDeviceIcon {
  switch (deviceType) {
    case ContainerDeviceType.Disk:
      return {
        name: iconMarker('mdi-harddisk'),
        tooltip: instancesHelptext.deviceBadgeTooltips.disk,
      };

    case ContainerDeviceType.Raw:
      return {
        name: iconMarker('mdi-file'),
        tooltip: instancesHelptext.deviceBadgeTooltips.raw,
      };

    case ContainerDeviceType.Filesystem:
      return {
        name: iconMarker('mdi-folder'),
        tooltip: instancesHelptext.deviceBadgeTooltips.filesystem,
      };

    case ContainerDeviceType.Usb:
      return {
        name: iconMarker('usb'),
        tooltip: instancesHelptext.deviceBadgeTooltips.usb,
      };

    case ContainerDeviceType.Nic:
      return {
        name: iconMarker('device_hub'),
        tooltip: instancesHelptext.deviceBadgeTooltips.nic,
      };

    default:
      return {
        name: iconMarker('help'),
        tooltip: instancesHelptext.deviceBadgeTooltips.unknown,
      };
  }
}

/**
 * Get a CSS class for styling based on device type
 */
export function getStorageDeviceClass(deviceType: ContainerDeviceType): string {
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
}

/**
 * Check if device type is a storage device (DISK, RAW, or FILESYSTEM)
 */
export function isStorageDevice(deviceType: ContainerDeviceType): boolean {
  return [
    ContainerDeviceType.Disk,
    ContainerDeviceType.Raw,
    ContainerDeviceType.Filesystem,
  ].includes(deviceType);
}
