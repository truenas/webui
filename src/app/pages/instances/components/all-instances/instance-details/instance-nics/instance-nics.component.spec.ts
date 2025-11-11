import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType, ContainerNicDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDeviceWithId } from 'app/interfaces/container.interface';
import {
  AddNicMenuComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-nics/add-nic-menu/add-nic-menu.component';
import {
  InstanceNicsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-nics/instance-nics.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('InstanceNicsComponent', () => {
  let spectator: Spectator<InstanceNicsComponent>;
  const devices: ContainerDeviceWithId[] = [
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
    component: InstanceNicsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponent(AddNicMenuComponent),
      MockComponent(DeviceActionsMenuComponent),
    ],
    providers: [
      mockProvider(VirtualizationDevicesStore, {
        isLoading: () => false,
        devices: () => devices,
      }),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: () => ({
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
