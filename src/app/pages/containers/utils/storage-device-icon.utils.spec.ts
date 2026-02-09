import { tnIconMarker } from '@truenas/ui-components';
import { ContainerDeviceType } from 'app/enums/container.enum';
import {
  getStorageDeviceClass,
  getStorageDeviceIcon,
  isStorageDevice,
} from './storage-device-icon.utils';

describe('Storage Device Icon Utils', () => {
  describe('getStorageDeviceIcon', () => {
    it('returns correct icon for filesystem device', () => {
      const result = getStorageDeviceIcon(ContainerDeviceType.Filesystem);
      expect(result.name).toEqual(tnIconMarker('folder', 'mdi'));
      expect(result.tooltip).toBeTruthy();
    });

    it('returns correct icon for USB device', () => {
      const result = getStorageDeviceIcon(ContainerDeviceType.Usb);
      expect(result.name).toEqual(tnIconMarker('usb', 'mdi'));
      expect(result.tooltip).toBeTruthy();
    });

    it('returns correct icon for NIC device', () => {
      const result = getStorageDeviceIcon(ContainerDeviceType.Nic);
      expect(result.name).toEqual(tnIconMarker('lan', 'mdi'));
      expect(result.tooltip).toBeTruthy();
    });

    it('returns correct icon for GPU device', () => {
      const result = getStorageDeviceIcon(ContainerDeviceType.Gpu);
      expect(result.name).toEqual(tnIconMarker('expansion-card', 'mdi'));
      expect(result.tooltip).toBeTruthy();
    });

    it('returns help icon for unknown device type', () => {
      const result = getStorageDeviceIcon('unknown' as ContainerDeviceType);
      expect(result.name).toEqual(tnIconMarker('help-circle', 'mdi'));
      expect(result.tooltip).toBeTruthy();
    });
  });

  describe('getStorageDeviceClass', () => {
    it('returns correct class for filesystem device', () => {
      expect(getStorageDeviceClass(ContainerDeviceType.Filesystem)).toBe('device-filesystem');
    });

    it('returns correct class for USB device', () => {
      expect(getStorageDeviceClass(ContainerDeviceType.Usb)).toBe('device-usb');
    });

    it('returns correct class for NIC device', () => {
      expect(getStorageDeviceClass(ContainerDeviceType.Nic)).toBe('device-nic');
    });

    it('returns correct class for GPU device', () => {
      expect(getStorageDeviceClass(ContainerDeviceType.Gpu)).toBe('device-gpu');
    });

    it('returns unknown class for unrecognized device type', () => {
      expect(getStorageDeviceClass('invalid' as ContainerDeviceType)).toBe('device-unknown');
    });
  });

  describe('isStorageDevice', () => {
    it('returns true for filesystem device', () => {
      expect(isStorageDevice(ContainerDeviceType.Filesystem)).toBe(true);
    });

    it('returns false for USB device', () => {
      expect(isStorageDevice(ContainerDeviceType.Usb)).toBe(false);
    });

    it('returns false for NIC device', () => {
      expect(isStorageDevice(ContainerDeviceType.Nic)).toBe(false);
    });

    it('returns false for GPU device', () => {
      expect(isStorageDevice(ContainerDeviceType.Gpu)).toBe(false);
    });
  });
});
