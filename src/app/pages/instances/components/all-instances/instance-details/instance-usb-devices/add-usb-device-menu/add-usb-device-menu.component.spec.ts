import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType, ContainerType } from 'app/enums/container.enum';
import { AvailableUsb, ContainerDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddUsbDeviceMenuComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-usb-devices/add-usb-device-menu/add-usb-device-menu.component';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

describe('AddUsbDeviceMenuComponent', () => {
  let spectator: Spectator<AddUsbDeviceMenuComponent>;
  let loader: HarnessLoader;
  const selectedInstance = signal({
    id: 123,
    type: ContainerType.Container,
  });
  const createComponent = createComponentFactory({
    component: AddUsbDeviceMenuComponent,
    providers: [
      mockApi([
        mockCall('container.device.usb_choices', {
          usb1: {
            vendor_id: '046d',
            product_id: 'already-added',
            product: 'Web Cam',
          } as AvailableUsb,
          usb2: {
            vendor_id: '0781',
            product_id: 'new',
            product: 'Card Reader',
          } as AvailableUsb,
        }),
        mockCall('container.device.create'),
      ]),
      mockProvider(ContainerInstancesStore, {
        selectedInstance,
      }),
      mockProvider(ContainerDevicesStore, {
        devices: () => [
          {
            dtype: ContainerDeviceType.Usb,
            usb: {
              vendor_id: '046d',
              product_id: 'already-added',
            },
            device: null,
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
        usb: {
          vendor_id: '0781',
          product_id: 'new',
        },
      } as ContainerDevice,
    }]);
    expect(spectator.inject(ContainerDevicesStore).loadDevices).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('USB Device was added');
  });
});
