import { ContainerDeviceType } from 'app/enums/container.enum';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { iconMarker, MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

/**
 * Icon mapping for container device types (Filesystem, USB, NIC)
 * Uses Material Design Icons (mdi) from ix-icon component
 */
export interface StorageDeviceIcon {
  name: MarkedIcon;
  color?: string;
  tooltip: string;
}

/**
 * Get icon configuration for a container device type
 */
export function getStorageDeviceIcon(deviceType: ContainerDeviceType): StorageDeviceIcon {
  switch (deviceType) {
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
 * Check if device type is a filesystem device
 */
export function isStorageDevice(deviceType: ContainerDeviceType): boolean {
  return deviceType === ContainerDeviceType.Filesystem;
}
