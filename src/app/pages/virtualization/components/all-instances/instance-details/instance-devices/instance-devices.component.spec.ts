import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationProxy, VirtualizationUsb } from 'app/interfaces/virtualization.interface';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  DeleteDeviceButtonComponent,
} from 'app/pages/virtualization/components/common/delete-device-button/delete-device-button.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

describe('InstanceDevicesComponent', () => {
  let spectator: Spectator<InstanceDevicesComponent>;
  const devices = [
    {
      dev_type: VirtualizationDeviceType.Usb,
      description: 'USB: My USB device',
      product_id: '1234',
      name: 'usb1',

    } as VirtualizationUsb,
    {
      dev_type: VirtualizationDeviceType.Gpu,
      name: 'gpu1',
      description: 'GPU: My GPU',
      product_id: '4321',
    },
    {
      name: 'gpu1',
    } as VirtualizationProxy,
  ];

  const createComponent = createComponentFactory({
    component: InstanceDevicesComponent,
    imports: [
      MockComponent(DeleteDeviceButtonComponent),
    ],
    providers: [
      mockProvider(VirtualizationInstancesStore, {
        isLoadingDevices: () => false,
        selectedInstance: () => ({ id: 'my-instance' }),
        selectedInstanceDevices: () => devices,
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a list of USB or GPU devices', () => {
    const deviceRows = spectator.queryAll('.device');

    expect(deviceRows).toHaveLength(2);
    expect(deviceRows[0]).toHaveText('USB: My USB device (1234)');
    expect(deviceRows[1]).toHaveText('GPU: My GPU (4321)');
  });

  it('renders a button to delete the device', () => {
    const deleteButtons = spectator.queryAll(DeleteDeviceButtonComponent);
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0].device).toBe(devices[0]);
  });
});
