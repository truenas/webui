import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { ContainerDeviceType, ContainerNicDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDevice, ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  AddNicMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/add-nic-menu/add-nic-menu.component';
import {
  ContainerNicDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/container-nic-devices.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

const sharedImports = [
  NgxSkeletonLoaderComponent,
  MockComponent(AddNicMenuComponent),
  MockComponent(DeviceActionsMenuComponent),
];

const sharedProviders = [
  mockAuth(),
  mockProvider(SnackbarService),
  mockProvider(ContainerConfigStore, {
    config: () => ({ bridge: null } as ContainerGlobalConfig),
  }),
];

const defaultContainersStoreProvider = mockProvider(ContainersStore, {
  selectedContainer: () => ({
    id: 5,
    status: { state: ContainerStatus.Stopped },
  }),
});

const noPendingChangesProvider = mockTypedApi([
  mockTypedCall('interface.has_pending_changes', false),
  mockTypedCall('container.device.create', null),
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
      ...sharedProviders,
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

    expect(deviceRows).toHaveLength(2);
    expect(deviceRows[0]).toHaveText('br0 (Default Mac Address)');
    expect(deviceRows[1]).toHaveText('br1 (Default Mac Address)');
  });

  it('does not show the no network notice', () => {
    expect(spectator.query('.no-network')).not.toExist();
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

  // Middleware refuses device operations on any container that is not stopped, which
  // since 26.0 includes SUSPENDED and not just RUNNING.
  describe.each([ContainerStatus.Running, ContainerStatus.Suspended])('when the container is %s', (state) => {
    const createActiveComponent = createComponentFactory({
      component: ContainerNicDevicesComponent,
      imports: sharedImports,
      providers: [
        ...sharedProviders,
        mockProvider(ContainerDevicesStore, {
          isLoading: () => false,
          devices: () => devices,
        }),
        mockProvider(ContainersStore, {
          selectedContainer: () => ({
            status: { state },
          }),
        }),
        noPendingChangesProvider,
      ],
    });

    it('disables the device actions menu', () => {
      const activeSpectator = createActiveComponent();

      const actionsMenu = activeSpectator.query(DeviceActionsMenuComponent)!;
      expect(actionsMenu.isDisabled).toBe(true);
      expect(actionsMenu.disabledTooltip)
        .toBe('Cannot modify devices unless the container is stopped. Please stop the container first.');
    });
  });

  describe('when the container has no NIC', () => {
    let loader: HarnessLoader;
    let emptySpectator: Spectator<ContainerNicDevicesComponent>;

    const createEmptyComponent = createComponentFactory({
      component: ContainerNicDevicesComponent,
      imports: sharedImports,
      providers: [
        ...sharedProviders,
        mockProvider(ContainerDevicesStore, {
          isLoading: () => false,
          devices: (): ContainerDevice[] => [],
          reload: jest.fn(),
        }),
        defaultContainersStoreProvider,
        noPendingChangesProvider,
      ],
    });

    beforeEach(() => {
      emptySpectator = createEmptyComponent();
      loader = TestbedHarnessEnvironment.loader(emptySpectator.fixture);
    });

    it('explains that the container has no network access', () => {
      expect(emptySpectator.query('.no-network-title')).toHaveText('No network access');
      expect(emptySpectator.query('.no-network-message')).toHaveText('only has a loopback interface');
    });

    it('adds a NIC on the default bridge without asking where to attach it', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: 'Add NIC on truenasbr0' }));
      await button.click();

      expect(emptySpectator.inject(TypedApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 5,
        attributes: { dtype: ContainerDeviceType.Nic },
      }]);
      expect(emptySpectator.inject(SnackbarService).success).toHaveBeenCalledWith('NIC Device was added');
      expect(emptySpectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
    });
  });

  describe('when the container has no NIC and is running', () => {
    const createRunningEmptyComponent = createComponentFactory({
      component: ContainerNicDevicesComponent,
      imports: sharedImports,
      providers: [
        ...sharedProviders,
        mockProvider(ContainerDevicesStore, {
          isLoading: () => false,
          devices: (): ContainerDevice[] => [],
        }),
        mockProvider(ContainersStore, {
          selectedContainer: () => ({ id: 5, status: { state: ContainerStatus.Running } }),
        }),
        noPendingChangesProvider,
      ],
    });

    it('disables the quick add button', async () => {
      const runningSpectator = createRunningEmptyComponent();
      const loader = TestbedHarnessEnvironment.loader(runningSpectator.fixture);
      const button = await loader.getHarness(TnButtonHarness.with({ label: 'Add NIC on truenasbr0' }));
      expect(await button.isDisabled()).toBe(true);
    });
  });

  describe('when a custom default bridge is configured', () => {
    const createCustomBridgeComponent = createComponentFactory({
      component: ContainerNicDevicesComponent,
      imports: sharedImports,
      providers: [
        mockAuth(),
        mockProvider(SnackbarService),
        mockProvider(ContainerConfigStore, {
          config: () => ({ bridge: 'br5' } as ContainerGlobalConfig),
        }),
        mockProvider(ContainerDevicesStore, {
          isLoading: () => false,
          devices: (): ContainerDevice[] => [],
        }),
        defaultContainersStoreProvider,
        noPendingChangesProvider,
      ],
    });

    it('names that bridge on the quick add button', async () => {
      const customSpectator = createCustomBridgeComponent();
      const loader = TestbedHarnessEnvironment.loader(customSpectator.fixture);
      expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Add NIC on br5' }))).not.toBeNull();
    });
  });
});
