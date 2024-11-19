import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { AvailableGpu, AvailableUsb, VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  AddDeviceMenuComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/add-device-menu/add-device-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { ApiService } from 'app/services/api.service';

describe('AddDeviceMenuComponent', () => {
  let spectator: Spectator<AddDeviceMenuComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddDeviceMenuComponent,
    providers: [
      mockApi([
        mockCall('virt.device.usb_choices', {
          usb1: {
            product_id: 'already-added',
            product: 'Web Cam',
          } as AvailableUsb,
          usb2: {
            product_id: 'new',
            product: 'Card Reader',
          } as AvailableUsb,
        }),
        mockCall('virt.device.gpu_choices', {
          gpu1: {
            description: 'NDIVIA XTR 2000',
          } as AvailableGpu,
          gpu2: {
            description: 'MAD Galeon 5000',
          } as AvailableGpu,
        }),
        mockCall('virt.instance.device_add'),
      ]),
      mockProvider(VirtualizationDevicesStore, {
        selectedInstance: () => ({ id: 'my-instance' }),
        devices: () => [
          {
            dev_type: VirtualizationDeviceType.Usb,
            product_id: 'already-added',
          },
          {
            dev_type: VirtualizationDeviceType.Gpu,
            description: 'NDIVIA XTR 2000',
          },
        ] as VirtualizationDevice[],
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

  it('shows available USB devices and GPUs that have not been already added to this system', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    expect(menuItems).toHaveLength(2);
    expect(await menuItems[0].getText()).toContain('Card Reader');
    expect(await menuItems[1].getText()).toContain('MAD Galeon 5000');
  });

  it('adds a usb device when it is selected', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    await menu.clickItem({ text: 'Card Reader' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_add', ['my-instance', {
      dev_type: VirtualizationDeviceType.Usb,
      product_id: 'new',
    } as VirtualizationDevice]);
    expect(spectator.inject(VirtualizationDevicesStore).loadDevices).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Device was added');
  });

  it('adds a gpu when it is selected', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    await menu.clickItem({ text: 'MAD Galeon 5000' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_add', ['my-instance', {
      dev_type: VirtualizationDeviceType.Gpu,
      description: 'MAD Galeon 5000',
    } as VirtualizationDevice]);
    expect(spectator.inject(VirtualizationDevicesStore).loadDevices).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Device was added');
  });
});
