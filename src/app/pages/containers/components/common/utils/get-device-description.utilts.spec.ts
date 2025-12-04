import { TranslateService } from '@ngx-translate/core';
import {
  ContainerDeviceType,
  ContainerGpuType,
} from 'app/enums/container.enum';
import {
  ContainerDevice,
  ContainerFilesystemDevice,
  ContainerGpuDevice,
  ContainerNicDevice,
  ContainerUsbDevice,
} from 'app/interfaces/container.interface';
import { getDeviceDescription } from 'app/pages/containers/components/common/utils/get-device-description.utils';

describe('getDeviceDescription', () => {
  const mockTranslate = {
    instant: jest.fn((key: string) => key),
  } as unknown as TranslateService;

  describe('NIC devices', () => {
    it('should return "nic_attach (mac)" for a NIC device with mac address', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Nic,
        nic_attach: 'br0',
        mac: '00:11:22:33:44:55',
        type: 'VIRTIO',
        trust_guest_rx_filters: false,
      } as ContainerNicDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('br0 (00:11:22:33:44:55)');
    });

    it('should use default mac address text when mac is null', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Nic,
        nic_attach: 'ens1',
        mac: null,
        type: 'E1000',
        trust_guest_rx_filters: true,
      } as ContainerNicDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('ens1 (Default Mac Address)');
    });

    it('should use "Unknown" when nic_attach is null', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Nic,
        nic_attach: null,
        mac: '00:11:22:33:44:55',
        type: 'VIRTIO',
        trust_guest_rx_filters: false,
      } as ContainerNicDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('Unknown (00:11:22:33:44:55)');
    });
  });

  describe('Filesystem devices', () => {
    it('should return filesystem description with source and target', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/tank/dataset',
        target: '/data',
      } as ContainerFilesystemDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('/mnt/tank/dataset → /data');
    });

    it('should handle missing source', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Filesystem,
        source: '',
        target: '/data',
      } as ContainerFilesystemDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('Unknown source → /data');
    });

    it('should handle missing target', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/tank/dataset',
        target: '',
      } as ContainerFilesystemDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('/mnt/tank/dataset → Unknown target');
    });
  });

  describe('USB devices', () => {
    it('should return USB description with vendor and product IDs', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Usb,
        usb: {
          vendor_id: '046d',
          product_id: 'c52b',
        },
        device: null,
      } as ContainerUsbDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('USB 046d:c52b');
    });

    it('should return device path when usb is null', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Usb,
        usb: null,
        device: '/dev/bus/usb/001/002',
      } as ContainerUsbDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('/dev/bus/usb/001/002');
    });

    it('should return "Unknown" when both usb and device are null', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Usb,
        usb: null,
        device: null,
      } as ContainerUsbDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('Unknown');
    });
  });

  describe('GPU devices', () => {
    it('should return GPU description with type and PCI address for NVIDIA', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Gpu,
        gpu_type: ContainerGpuType.Nvidia,
        pci_address: '0000:19:00.0',
      } as ContainerGpuDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('NVIDIA GPU (0000:19:00.0)');
    });

    it('should return GPU description with type and PCI address for AMD', () => {
      const device: ContainerDevice = {
        dtype: ContainerDeviceType.Gpu,
        gpu_type: ContainerGpuType.Amd,
        pci_address: '0000:1a:00.0',
      } as ContainerGpuDevice;

      const result = getDeviceDescription(mockTranslate as TranslateService, device);
      expect(result).toBe('AMD GPU (0000:1a:00.0)');
    });
  });
});
