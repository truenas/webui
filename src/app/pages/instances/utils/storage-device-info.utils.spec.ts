import { ContainerDeviceType } from 'app/enums/container.enum';
import {
  ContainerDiskDevice,
  ContainerFilesystemDevice,
  ContainerRawDevice,
} from 'app/interfaces/container.interface';
import {
  getContainerDevicePath,
  getStorageDeviceInfo,
  isBlockDevice,
  isFilesystemDevice,
} from './storage-device-info.utils';

describe('Storage Device Info Utils', () => {
  describe('getStorageDeviceInfo', () => {
    it('should return correct info for DISK device', () => {
      const info = getStorageDeviceInfo(ContainerDeviceType.Disk);

      expect(info.type).toBe(ContainerDeviceType.Disk);
      expect(info.xmlType).toBe('block');
      expect(info.deviceType).toBe('disk');
      expect(info.presentedAs).toContain('/dev/sda');
      expect(info.description).toContain('zvol');
      expect(info.example).toContain('/dev/zvol');
    });

    it('should return correct info for RAW device', () => {
      const info = getStorageDeviceInfo(ContainerDeviceType.Raw);

      expect(info.type).toBe(ContainerDeviceType.Raw);
      expect(info.xmlType).toBe('file');
      expect(info.deviceType).toBe('disk');
      expect(info.presentedAs).toContain('/dev/sda');
      expect(info.description).toContain('raw file');
      expect(info.example).toContain('<source file=');
    });

    it('should return correct info for FILESYSTEM device', () => {
      const info = getStorageDeviceInfo(ContainerDeviceType.Filesystem);

      expect(info.type).toBe(ContainerDeviceType.Filesystem);
      expect(info.xmlType).toBe('dir');
      expect(info.deviceType).toBe('filesystem');
      expect(info.presentedAs).toContain('Directory');
      expect(info.description).toContain('bind mount');
      expect(info.example).toContain('target=');
    });
  });

  describe('isBlockDevice', () => {
    it('should return true for DISK device', () => {
      const device = {
        dtype: ContainerDeviceType.Disk,
        path: '/dev/zvol/tank/my-zvol',
        type: 'VIRTIO',
      } as ContainerDiskDevice;

      expect(isBlockDevice(device)).toBe(true);
    });

    it('should return true for RAW device', () => {
      const device = {
        dtype: ContainerDeviceType.Raw,
        path: '/mnt/tank/raw_device',
        type: 'VIRTIO',
      } as ContainerRawDevice;

      expect(isBlockDevice(device)).toBe(true);
    });

    it('should return false for FILESYSTEM device', () => {
      const device = {
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/tank/dataset',
        target: '/data',
      } as ContainerFilesystemDevice;

      expect(isBlockDevice(device)).toBe(false);
    });
  });

  describe('isFilesystemDevice', () => {
    it('should return false for DISK device', () => {
      const device = {
        dtype: ContainerDeviceType.Disk,
        path: '/dev/zvol/tank/my-zvol',
        type: 'VIRTIO',
      } as ContainerDiskDevice;

      expect(isFilesystemDevice(device)).toBe(false);
    });

    it('should return false for RAW device', () => {
      const device = {
        dtype: ContainerDeviceType.Raw,
        path: '/mnt/tank/raw_device',
        type: 'VIRTIO',
      } as ContainerRawDevice;

      expect(isFilesystemDevice(device)).toBe(false);
    });

    it('should return true for FILESYSTEM device', () => {
      const device = {
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/tank/dataset',
        target: '/data',
      } as ContainerFilesystemDevice;

      expect(isFilesystemDevice(device)).toBe(true);
    });
  });

  describe('getContainerDevicePath', () => {
    it('should return null for DISK device (auto-assigned)', () => {
      const device = {
        dtype: ContainerDeviceType.Disk,
        path: '/dev/zvol/tank/my-zvol',
        type: 'VIRTIO',
      } as ContainerDiskDevice;

      expect(getContainerDevicePath(device)).toBeNull();
    });

    it('should return null for RAW device (auto-assigned)', () => {
      const device = {
        dtype: ContainerDeviceType.Raw,
        path: '/mnt/tank/raw_device',
        type: 'VIRTIO',
      } as ContainerRawDevice;

      expect(getContainerDevicePath(device)).toBeNull();
    });

    it('should return target path for FILESYSTEM device', () => {
      const device = {
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/tank/dataset',
        target: '/data',
      } as ContainerFilesystemDevice;

      expect(getContainerDevicePath(device)).toBe('/data');
    });
  });
});
