import { TranslateService } from '@ngx-translate/core';
import {
  VirtualizationDeviceType,
  VirtualizationNicType,
} from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
  VirtualizationNic,
} from 'app/interfaces/container.interface';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';

describe('getDeviceDescription', () => {
  const mockTranslate = {
    instant: jest.fn((key: string) => key),
  } as unknown as TranslateService;

  it('should return "typeLabel: name (nic_type)" for a NIC device', () => {
    const device: VirtualizationDevice = {
      dev_type: VirtualizationDeviceType.Nic,
      name: 'eth0',
      nic_type: VirtualizationNicType.Bridged,
    } as VirtualizationNic;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('NIC: eth0 (BRIDGED) (Default Mac Address)');
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
