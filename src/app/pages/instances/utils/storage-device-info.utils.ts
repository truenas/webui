import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ContainerDeviceType } from 'app/enums/container.enum';
import {
  StorageDevice,
} from 'app/interfaces/container.interface';

/**
 * Storage device type information based on libvirt XML configuration
 */
export interface StorageDeviceInfo {
  type: ContainerDeviceType.Disk | ContainerDeviceType.Raw | ContainerDeviceType.Filesystem;
  xmlType?: 'block' | 'file' | 'dir';
  deviceType?: 'disk' | 'filesystem';
  presentedAs: string;
  description: string;
  example: string;
}

/**
 * Get detailed information about storage device types
 *
 * Based on container.device API:
 * - DISK: path → zvol/dataset, type → AHCI/VIRTIO
 * - RAW: path → raw file, type → AHCI/VIRTIO
 * - FILESYSTEM: source → host dir, target → container mount point
 */
export function getStorageDeviceInfo(
  deviceType: ContainerDeviceType.Disk | ContainerDeviceType.Raw | ContainerDeviceType.Filesystem,
): StorageDeviceInfo {
  switch (deviceType) {
    case ContainerDeviceType.Disk:
      return {
        type: ContainerDeviceType.Disk,
        xmlType: 'block',
        deviceType: 'disk',
        presentedAs: T('Block device (e.g., /dev/sda, /dev/sdb)'),
        description: T('A zvol from the host presented as a block device inside the container'),
        example: T('path="/dev/zvol/tank/my-zvol", type="VIRTIO"'),
      };

    case ContainerDeviceType.Raw:
      return {
        type: ContainerDeviceType.Raw,
        xmlType: 'file',
        deviceType: 'disk',
        presentedAs: T('Block device (e.g., /dev/sda, /dev/sdb)'),
        description: T('A raw file from the host presented as a block device inside the container'),
        example: T('path="/mnt/tank/raw_device", type="VIRTIO"'),
      };

    case ContainerDeviceType.Filesystem:
      return {
        type: ContainerDeviceType.Filesystem,
        xmlType: 'dir',
        deviceType: 'filesystem',
        presentedAs: T('Directory mount point'),
        description: T('A bind mount that makes a host directory available inside the container'),
        example: T('source="/mnt/tank/dataset", target="/data"'),
      };

    default:
      throw new Error(`Unknown storage device type: ${String(deviceType)}`);
  }
}

/**
 * Check if a device is a block device (DISK or RAW)
 */
export function isBlockDevice(
  device: StorageDevice,
): boolean {
  return device.dtype === ContainerDeviceType.Disk || device.dtype === ContainerDeviceType.Raw;
}

/**
 * Check if a device is a filesystem device
 */
export function isFilesystemDevice(
  device: StorageDevice,
): boolean {
  return device.dtype === ContainerDeviceType.Filesystem;
}

/**
 * Get the device path that will appear inside the container
 * For DISK/RAW devices: Block device path is auto-assigned by the system
 * For FILESYSTEM devices: returns the mount target (e.g., '/data')
 */
export function getContainerDevicePath(
  device: StorageDevice,
): string | null {
  if (device.dtype === ContainerDeviceType.Filesystem) {
    return device.target;
  }

  // DISK and RAW devices get auto-assigned block device names
  return null;
}
