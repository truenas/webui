import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerType } from 'app/enums/container.enum';
import { AvailableUsb, ContainerDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddUsbDeviceMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-usb-devices/add-usb-device-menu/add-usb-device-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

describe('AddUsbDeviceMenuComponent', () => {
  let spectator: Spectator<AddUsbDeviceMenuComponent>;
  let loader: HarnessLoader;
  const selectedContainer = signal({
    id: 123,
    type: ContainerType.Container,
  });
  const createComponent = createComponentFactory({
    component: AddUsbDeviceMenuComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.usb_choices', {
          usb_1_1: {
            capability: {
              vendor_id: '0x046d',
              product_id: '0x0001',
              product: 'Web Cam',
            },
            available: true,
            description: 'Web Cam',
          } as AvailableUsb,
          usb_1_2: {
            capability: {
              vendor_id: '0x0781',
              product_id: '0x0002',
              product: 'Card Reader',
            },
            available: true,
            description: 'Card Reader',
          } as AvailableUsb,
        }),
        mockCall('container.device.create'),
      ]),
      mockProvider(ContainersStore, {
        selectedContainer,
      }),
      mockProvider(ContainerDevicesStore, {
        devices: () => [
          {
            dtype: ContainerDeviceType.Usb,
            usb: {
              vendor_id: '0x046d',
              product_id: '0x0001',
            },
            device: 'usb_1_1',
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

  it('shows available USB devices that have not been already added to this system', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    expect(menuItems).toHaveLength(1);
    expect(await menuItems[0].getText()).toContain('Card Reader');
  });

  it('adds a usb device when it is selected', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    await menu.clickItem({ text: 'Card Reader' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
      container: 123,
      attributes: {
        dtype: ContainerDeviceType.Usb,
        device: null,
        usb: {
          vendor_id: '0x0781',
          product_id: '0x0002',
        },
      } as ContainerDevice,
    }]);
    expect(spectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('USB Device was added');
  });
});
