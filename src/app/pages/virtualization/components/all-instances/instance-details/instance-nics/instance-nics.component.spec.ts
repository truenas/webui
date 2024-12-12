import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import {
  AddNicMenuComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-nics/add-nic-menu/add-nic-menu.component';
import {
  InstanceNicsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-nics/instance-nics.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/virtualization/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';

describe('InstanceNicsComponent', () => {
  let spectator: Spectator<InstanceNicsComponent>;
  const devices = [
    {
      dev_type: VirtualizationDeviceType.Nic,
      nic_type: 'Intel E1000',
      name: 'nic1',
    },
    {
      dev_type: VirtualizationDeviceType.Nic,
      nic_type: 'Realtek RTL8139',
      name: 'nic2',
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
    expect(deviceRows[0]).toHaveText('Intel E1000');
    expect(deviceRows[1]).toHaveText('Realtek RTL8139');
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
