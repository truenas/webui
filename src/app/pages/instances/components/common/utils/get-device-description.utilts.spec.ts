import { TranslateService } from '@ngx-translate/core';
import {
  VirtualizationDeviceType,
  VirtualizationNicType,
} from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
  VirtualizationNic,
  VirtualizationPciDevice,
  VirtualizationTpm,
} from 'app/interfaces/virtualization.interface';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';

describe('getDeviceDescription', () => {
  const mockTranslate = {
    instant: jest.fn((key: string) => key),
  } as unknown as TranslateService;

  it('should return the TPM label for a TPM device', () => {
    const device: VirtualizationDevice = {
      dev_type: VirtualizationDeviceType.Tpm,
    } as VirtualizationTpm;

    const result = getDeviceDescription(mockTranslate, device);
    expect(result).toBe('Trusted Platform Module (TPM)');
  });

  it('should return "typeLabel: name (nic_type)" for a NIC device', () => {
    const device: VirtualizationDevice = {
      dev_type: VirtualizationDeviceType.Nic,
      name: 'eth0',
      nic_type: VirtualizationNicType.Bridged,
    } as VirtualizationNic;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('NIC: eth0 (BRIDGED)');
  });

  it('should return "typeLabel: description" for PCI devices', () => {
    const device: VirtualizationDevice = {
      dev_type: VirtualizationDeviceType.Pci,
      description: 'My device',
    } as VirtualizationPciDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('PCI: My device');
  });

  it('should return "dev_type: description" if dev_type label is not in the map', () => {
    const device: VirtualizationDevice = {
      dev_type: 'UNKNOWN_TYPE' as VirtualizationDeviceType,
      description: 'Unknown device',
    } as VirtualizationDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('UNKNOWN_TYPE: Unknown device');
  });
});
