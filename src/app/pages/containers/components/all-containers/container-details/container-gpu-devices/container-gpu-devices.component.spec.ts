import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnBannerHarness, TnButtonHarness } from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType, containerGpuType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddGpuDeviceMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-gpu-devices/add-gpu-device-menu/add-gpu-device-menu.component';
import {
  ContainerGpuDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-gpu-devices/container-gpu-devices.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('ContainerGpuDevicesComponent', () => {
  let spectator: Spectator<ContainerGpuDevicesComponent>;
  let loader: HarnessLoader;
  const devices: ContainerDevice[] = [
    {
      id: 1,
      dtype: ContainerDeviceType.Gpu,
      gpu_type: containerGpuType.Nvidia,
      pci_address: '0000:19:00.0',
    },
    {
      id: 2,
      dtype: ContainerDeviceType.Gpu,
      gpu_type: containerGpuType.Amd,
      pci_address: '0000:1a:00.0',
    },
  ];

  const createComponent = createComponentFactory({
    component: ContainerGpuDevicesComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        DeviceActionsMenuComponent,
        AddGpuDeviceMenuComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('system.advanced.update'),
      ]),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(SnackbarService),
      mockProvider(ContainersStore, {
        selectedContainer: () => fakeContainer({
          id: 1,
          status: { state: ContainerStatus.Stopped, pid: 0, domain_state: 'stopped' },
        }),
      }),
      mockProvider(ContainerDevicesStore, {
        isLoading: () => false,
        devices: () => devices,
        gpuChoices: () => ({
          '0000:19:00.0': containerGpuType.Nvidia,
          '0000:1a:00.0': containerGpuType.Amd,
        }),
        loadDevices: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: { nvidia: false },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of GPU devices', () => {
    const deviceRows = spectator.queryAll('.device');

    expect(deviceRows).toHaveLength(2);
    expect(deviceRows[0]).toHaveText('NVIDIA GPU (0000:19:00.0)');
    expect(deviceRows[1]).toHaveText('AMD GPU (0000:1a:00.0)');
  });

  it('renders a menu to delete the device', () => {
    const actionsMenu = spectator.queryAll(DeviceActionsMenuComponent);
    expect(actionsMenu).toHaveLength(2);
    expect(actionsMenu[0].device).toBe(devices[0]);
  });

  it('renders a menu to add a new device', () => {
    const addMenu = spectator.query(AddGpuDeviceMenuComponent);
    expect(addMenu).toExist();
  });

  it('shows warning when NVIDIA GPUs detected without drivers enabled', async () => {
    spectator.detectChanges();
    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('NVIDIA GPUs detected, but drivers are not enabled.');
  });

  it('enables NVIDIA drivers when clicking enable button', async () => {
    spectator.detectChanges();
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Enable NVIDIA Drivers' }));
    await button.click();

    const api = spectator.inject(ApiService);
    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ nvidia: true }]);

    const snackbar = spectator.inject(SnackbarService);
    expect(snackbar.success).toHaveBeenCalledWith('NVIDIA drivers have been enabled.');
  });
});
