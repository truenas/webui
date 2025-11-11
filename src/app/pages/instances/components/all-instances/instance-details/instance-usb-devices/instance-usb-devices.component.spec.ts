import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDeviceWithId } from 'app/interfaces/container.interface';
import {
  AddUsbDeviceMenuComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-usb-devices/add-usb-device-menu/add-usb-device-menu.component';
import {
  InstanceUsbDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-usb-devices/instance-usb-devices.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

describe('InstanceUsbDevicesComponent', () => {
  let spectator: Spectator<InstanceUsbDevicesComponent>;
  const devices: ContainerDeviceWithId[] = [
    {
      id: 1,
      dtype: ContainerDeviceType.Usb,
      usb: {
        vendor_id: '046d',
        product_id: '0825',
      },
      device: null,
    },
    {
      id: 2,
      dtype: ContainerDeviceType.Usb,
      usb: {
        vendor_id: '045e',
        product_id: '07f8',
      },
      device: null,
    },
  ];

  const createComponent = createComponentFactory({
    component: InstanceUsbDevicesComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        DeviceActionsMenuComponent,
        AddUsbDeviceMenuComponent,
      ),
    ],
    providers: [
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: () => fakeVirtualizationInstance({
          id: 1,
          status: { state: ContainerStatus.Stopped, pid: 0, domain_state: 'stopped' },
        }),
      }),
      mockProvider(VirtualizationDevicesStore, {
        isLoading: () => false,
        devices: () => devices,
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a list of USB devices', () => {
    const deviceRows = spectator.queryAll('.device');

    expect(deviceRows).toHaveLength(2);
    expect(deviceRows[0]).toHaveText('USB 046d:0825');
    expect(deviceRows[1]).toHaveText('USB 045e:07f8');
  });

  it('renders a menu to delete the device', () => {
    const actionsMenu = spectator.queryAll(DeviceActionsMenuComponent);
    expect(actionsMenu).toHaveLength(2);
    expect(actionsMenu[0].device).toBe(devices[0]);
  });

  it('renders a menu to add a new device', () => {
    const addMenu = spectator.query(AddUsbDeviceMenuComponent);
    expect(addMenu).toExist();
  });
});
