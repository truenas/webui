import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType, ContainerNicDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';
import {
  AddNicMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/add-nic-menu/add-nic-menu.component';
import {
  ContainerNicDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/container-nic-devices.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

describe('ContainerNicDevicesComponent', () => {
  let spectator: Spectator<ContainerNicDevicesComponent>;
  const devices: ContainerDevice[] = [
    {
      id: 1,
      dtype: ContainerDeviceType.Nic,
      trust_guest_rx_filters: false,
      type: ContainerNicDeviceType.Virtio,
      nic_attach: 'br0',
      mac: null,
    },
    {
      id: 2,
      dtype: ContainerDeviceType.Nic,
      trust_guest_rx_filters: false,
      type: ContainerNicDeviceType.E1000,
      nic_attach: 'br1',
      mac: null,
    },
  ];

  const createComponent = createComponentFactory({
    component: ContainerNicDevicesComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponent(AddNicMenuComponent),
      MockComponent(DeviceActionsMenuComponent),
    ],
    providers: [
      mockProvider(ContainerDevicesStore, {
        isLoading: () => false,
        devices: () => devices,
      }),
      mockProvider(ContainersStore, {
        selectedContainer: () => ({
          status: { state: ContainerStatus.Stopped },
        }),
      }),
      mockApi([
        mockCall('interface.has_pending_changes', false),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('displays NIC devices when available', () => {
    const deviceRows = spectator.queryAll('.device');

    expect(deviceRows).toHaveLength(2);
    expect(deviceRows[0]).toHaveText('br0 (Default Mac Address)');
    expect(deviceRows[1]).toHaveText('br1 (Default Mac Address)');
  });

  it('renders a menu to delete or manage the device', () => {
    const actionsMenu = spectator.queryAll(DeviceActionsMenuComponent);
    expect(actionsMenu).toHaveLength(2);
    expect(actionsMenu[0].device).toBe(devices[0]);
    expect(actionsMenu[1].device).toBe(devices[1]);
  });

  it('shows the add NIC menu if no pending changes', () => {
    const addMenu = spectator.query(AddNicMenuComponent);
    expect(addMenu).toExist();
  });
});
