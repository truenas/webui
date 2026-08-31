import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { AvailableUsb, ContainerDevice } from 'app/interfaces/container.interface';
import {
  AddUsbDeviceMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-usb-devices/add-usb-device-menu/add-usb-device-menu.component';
import {
  ContainerUsbDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-usb-devices/container-usb-devices.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainerUsbDevicesComponent', () => {
  let spectator: Spectator<ContainerUsbDevicesComponent>;
  const devices: ContainerDevice[] = [
    {
      id: 1,
      dtype: ContainerDeviceType.Usb,
      usb: null,
      device: 'usb_1_1',
    },
    {
      id: 2,
      dtype: ContainerDeviceType.Usb,
      usb: {
        vendor_id: '0x045e',
        product_id: '0x07f8',
      },
      device: null,
    },
    {
      id: 3,
      dtype: ContainerDeviceType.Usb,
      usb: {
        vendor_id: '0x1234',
        product_id: '0x5678',
      },
      device: null,
    },
  ];

  const createComponent = createComponentFactory({
    component: ContainerUsbDevicesComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        DeviceActionsMenuComponent,
        AddUsbDeviceMenuComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('container.device.usb_choices', {
          usb_1_1: {
            capability: { vendor_id: '0x046d', product_id: '0x0825' },
            available: true,
            description: 'Web Cam by Logitech',
          } as AvailableUsb,
          usb_1_2: {
            capability: { vendor_id: '0x045e', product_id: '0x07f8' },
            available: false,
            description: 'Wireless Controller by Microsoft',
          } as AvailableUsb,
        }),
      ]),
      mockProvider(ContainersStore, {
        selectedContainer: () => fakeContainer({
          id: 1,
          status: { state: ContainerStatus.Stopped, pid: 0, domain_state: 'stopped' },
        }),
      }),
      mockProvider(ContainerDevicesStore, {
        isLoading: () => false,
        devices: () => devices,
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows human-readable descriptions for USB devices middleware knows about', () => {
    const deviceRows = spectator.queryAll('.device');

    expect(deviceRows).toHaveLength(3);
    // Recorded by physical port - resolved via the choice key.
    expect(deviceRows[0]).toHaveText('Web Cam by Logitech');
    // Recorded by vendor/product IDs - resolved via matching capability.
    expect(deviceRows[1]).toHaveText('Wireless Controller by Microsoft');
    // Not connected at the moment - falls back to the raw identifiers.
    expect(deviceRows[2]).toHaveText('USB 0x1234:0x5678');
  });

  it('renders a menu to delete the device', () => {
    const actionsMenu = spectator.queryAll(DeviceActionsMenuComponent);
    expect(actionsMenu).toHaveLength(3);
    expect(actionsMenu[0].device).toBe(devices[0]);
  });

  it('renders a menu to add a new device', () => {
    const addMenu = spectator.query(AddUsbDeviceMenuComponent);
    expect(addMenu).toExist();
  });
});
