import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationProxy, VirtualizationUsb } from 'app/interfaces/virtualization.interface';
import {
  AddDeviceMenuComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/add-device-menu/add-device-menu.component';
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
      description: 'USB Microphone',
    } as VirtualizationUsb,
    {
      dev_type: VirtualizationDeviceType.Gpu,
      description: 'Matrox G200eW',
    },
    {
      name: 'gpu1',
    } as VirtualizationProxy,
  ];

  const createComponent = createComponentFactory({
    component: InstanceDevicesComponent,
    imports: [
      MockComponents(
        DeleteDeviceButtonComponent,
        AddDeviceMenuComponent,
      ),
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
    expect(deviceRows[0]).toHaveText('USB Microphone');
    expect(deviceRows[1]).toHaveText('Matrox G200eW');
  });

  it('renders a button to delete the device', () => {
    const deleteButtons = spectator.queryAll(DeleteDeviceButtonComponent);
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0].device).toBe(devices[0]);
  });

  it('renders a menu to add a new device', () => {
    const addMenu = spectator.query(AddDeviceMenuComponent);
    expect(addMenu).toExist();
  });
});