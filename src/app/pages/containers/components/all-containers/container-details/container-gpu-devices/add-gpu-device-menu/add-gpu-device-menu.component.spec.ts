import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerGpuType, ContainerType } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddGpuDeviceMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-gpu-devices/add-gpu-device-menu/add-gpu-device-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('AddGpuDeviceMenuComponent', () => {
  let spectator: Spectator<AddGpuDeviceMenuComponent>;
  let loader: HarnessLoader;
  const selectedContainer = signal({
    id: 123,
    type: ContainerType.Container,
  });
  const createComponent = createComponentFactory({
    component: AddGpuDeviceMenuComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.gpu_choices', {
          '0000:19:00.0': ContainerGpuType.Nvidia,
          '0000:1a:00.0': ContainerGpuType.Amd,
        }),
        mockCall('container.device.create'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              nvidia: true,
            },
          },
        ],
      }),
      mockProvider(ContainersStore, {
        selectedContainer,
      }),
      mockProvider(ContainerDevicesStore, {
        devices: () => [
          {
            dtype: ContainerDeviceType.Gpu,
            gpu_type: ContainerGpuType.Nvidia,
            pci_address: '0000:19:00.0',
          } as ContainerDevice,
        ] as ContainerDevice[],
        loadDevices: jest.fn(),
        isLoading: () => false,
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows available GPU devices that have not been already added to this container', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    expect(menuItems).toHaveLength(1);
    expect(await menuItems[0].getText()).toContain('AMD (0000:1a:00.0)');
  });

  it('adds a GPU device when it is selected', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    await menu.clickItem({ text: 'AMD (0000:1a:00.0)' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
      container: 123,
      attributes: {
        dtype: ContainerDeviceType.Gpu,
        gpu_type: 'AMD',
        pci_address: '0000:1a:00.0',
      } as ContainerDevice,
    }]);
    expect(spectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('GPU Device was added');
  });
});
