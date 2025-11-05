import { TranslateService } from '@ngx-translate/core';
import {
  ContainerDeviceType,
} from 'app/enums/container.enum';
import {
  ContainerDevice,
  ContainerDiskDevice,
  ContainerFilesystemDevice,
  ContainerNicDevice,
  ContainerRawDevice,
} from 'app/interfaces/container.interface';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';

describe('getDeviceDescription', () => {
  const mockTranslate = {
    instant: jest.fn((key: string) => key),
  } as unknown as TranslateService;

  it('should return "typeLabel: name (mac)" for a NIC device with name', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Nic,
      name: 'eth0',
      nic_attach: 'br0',
    } as ContainerNicDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('eth0 (Default Mac Address)');
  });

  it('should use nic_attach as name fallback for a NIC device without name', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Nic,
      nic_attach: 'ens1',
      mac: '00:11:22:33:44:55',
    } as ContainerNicDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('ens1 (00:11:22:33:44:55)');
  });

  it('should return disk description with path and type', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Disk,
      path: '/dev/zvol/tank/my-zvol',
      type: 'VIRTIO',
    } as ContainerDiskDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('/dev/zvol/tank/my-zvol (VIRTIO)');
  });

  it('should return disk description with AHCI type', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Disk,
      path: '/dev/zvol/tank/my-zvol',
      type: 'AHCI',
    } as ContainerDiskDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('/dev/zvol/tank/my-zvol (AHCI)');
  });

  it('should return raw device description with path', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Raw,
      path: '/mnt/tank/raw_device',
      type: 'VIRTIO',
    } as ContainerRawDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('/mnt/tank/raw_device (VIRTIO)');
  });

  it('should return raw device description with AHCI type', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Raw,
      path: '/mnt/tank/raw_device',
      type: 'AHCI',
    } as ContainerRawDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('/mnt/tank/raw_device (AHCI)');
  });

  it('should return filesystem description with source and target', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Filesystem,
      source: '/mnt/tank/dataset',
      target: '/data',
    } as ContainerFilesystemDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('/mnt/tank/dataset → /data');
  });

  it('should return "dtype: description" if dev_type label is not in the map', () => {
    const device: ContainerDevice = {
      dtype: 'UNKNOWN_TYPE' as ContainerDeviceType,
      description: 'Unknown device',
    } as ContainerDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('UNKNOWN_TYPE: Unknown device');
  });
});
