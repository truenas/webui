import { TranslateService } from '@ngx-translate/core';
import {
  ContainerDeviceType,
  ContainerNicType,
} from 'app/enums/container.enum';
import {
  ContainerDevice,
  ContainerNicDevice,
} from 'app/interfaces/container.interface';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';

describe('getDeviceDescription', () => {
  const mockTranslate = {
    instant: jest.fn((key: string) => key),
  } as unknown as TranslateService;

  it('should return "typeLabel: name (nic_type)" for a NIC device', () => {
    const device: ContainerDevice = {
      dtype: ContainerDeviceType.Nic,
      name: 'eth0',
      nic_type: ContainerNicType.Bridged,
    } as ContainerNicDevice;

    const result = getDeviceDescription(mockTranslate as TranslateService, device);
    expect(result).toBe('NIC: eth0 (BRIDGED) (Default Mac Address)');
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
