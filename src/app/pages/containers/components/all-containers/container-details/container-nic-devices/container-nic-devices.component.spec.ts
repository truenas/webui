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

const sharedImports = [
  NgxSkeletonLoaderComponent,
  MockComponent(AddNicMenuComponent),
  MockComponent(DeviceActionsMenuComponent),
];

const defaultContainersStoreProvider = mockProvider(ContainersStore, {
  selectedContainer: () => ({
    default_network: 'truenasbr0',
    status: { state: ContainerStatus.Stopped },
  }),
});

const noPendingChangesProvider = mockApi([
  mockCall('interface.has_pending_changes', false),
]);

describe('ContainerNicDevicesComponent', () => {
  let spectator: Spectator<ContainerNicDevicesComponent>;
  const devices: ContainerDevice[] = [
    {
      id: 1,
      dtype: ContainerDeviceType.Nic,
      type: ContainerNicDeviceType.Virtio,
      nic_attach: 'br0',
    },
    {
      id: 2,
      dtype: ContainerDeviceType.Nic,
      type: ContainerNicDeviceType.E1000,
      nic_attach: 'br1',
    },
  ] as ContainerDevice[];

  const createComponent = createComponentFactory({
    component: ContainerNicDevicesComponent,
    imports: sharedImports,
    providers: [
      mockProvider(ContainerDevicesStore, {
        isLoading: () => false,
        devices: () => devices,
      }),
      defaultContainersStoreProvider,
      noPendingChangesProvider,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('displays NIC devices when available', () => {
    const deviceRows = spectator.queryAll('.device');

    expect(deviceRows).toHaveLength(3);
    expect(deviceRows[0]).toHaveText('truenasbr0 (Default)');
    expect(deviceRows[1]).toHaveText('br0 (Default Mac Address)');
    expect(deviceRows[2]).toHaveText('br1 (Default Mac Address)');
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

  describe('when no NIC devices are configured', () => {
    const createEmptyComponent = createComponentFactory({
      component: ContainerNicDevicesComponent,
      imports: sharedImports,
      providers: [
        mockProvider(ContainerDevicesStore, {
          isLoading: () => false,
          devices: (): ContainerDevice[] => [],
        }),
        defaultContainersStoreProvider,
        noPendingChangesProvider,
      ],
    });

    it('shows default bridge when no NIC devices are added', () => {
      const emptySpectator = createEmptyComponent();
      expect(emptySpectator.query('.default-device')).toHaveText('truenasbr0 (Default)');
    });
  });

  describe('when default_network is null', () => {
    const createNullNetworkComponent = createComponentFactory({
      component: ContainerNicDevicesComponent,
      imports: sharedImports,
      providers: [
        mockProvider(ContainerDevicesStore, {
          isLoading: () => false,
          devices: (): ContainerDevice[] => [],
        }),
        mockProvider(ContainersStore, {
          selectedContainer: () => ({
            default_network: null,
            status: { state: ContainerStatus.Stopped },
          }),
        }),
        noPendingChangesProvider,
      ],
    });

    it('does not show default bridge row', () => {
      const nullSpectator = createNullNetworkComponent();
      expect(nullSpectator.query('.default-device')).not.toExist();
    });

    it('shows empty state message', () => {
      const nullSpectator = createNullNetworkComponent();
      expect(nullSpectator.query('.no-devices')).toHaveText('No NIC devices added.');
    });
  });

  describe('when default bridge matches an existing NIC device', () => {
    const createMatchingBridgeComponent = createComponentFactory({
      component: ContainerNicDevicesComponent,
      imports: sharedImports,
      providers: [
        mockProvider(ContainerDevicesStore, {
          isLoading: () => false,
          devices: (): ContainerDevice[] => [
            {
              id: 1,
              dtype: ContainerDeviceType.Nic,
              nic_attach: 'truenasbr0',
            } as ContainerDevice,
          ],
        }),
        defaultContainersStoreProvider,
        noPendingChangesProvider,
      ],
    });

    it('does not show default bridge row when a NIC device already uses the same bridge', () => {
      const matchSpectator = createMatchingBridgeComponent();
      expect(matchSpectator.query('.default-device')).not.toExist();
    });
  });
});
