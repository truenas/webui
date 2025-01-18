import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDeviceType, VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { AvailableGpu, AvailableUsb, VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddDeviceMenuComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/add-device-menu/add-device-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';

describe('AddDeviceMenuComponent', () => {
  let spectator: Spectator<AddDeviceMenuComponent>;
  let loader: HarnessLoader;
  const selectedInstance = signal({
    id: 'my-instance',
    status: VirtualizationStatus.Running,
    type: VirtualizationType.Container,
  });
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
          pci_0000_01_00_0: {
            description: 'NDIVIA XTR 2000',
          } as AvailableGpu,
          pci_0000_01_00_1: {
            description: 'MAD Galeon 5000',
          } as AvailableGpu,
        }),
        mockCall('virt.instance.device_add'),
      ]),
      mockProvider(VirtualizationDevicesStore, {
        selectedInstance,
        devices: () => [
          {
            dev_type: VirtualizationDeviceType.Usb,
            product_id: 'already-added',
          },
          {
            dev_type: VirtualizationDeviceType.Gpu,
            pci: 'pci_0000_01_00_0',
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
      pci: 'pci_0000_01_00_1',
    } as VirtualizationDevice]);
    expect(spectator.inject(VirtualizationDevicesStore).loadDevices).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Device was added');
  });

  describe('TPM', () => {
    it('allows TPM to be added to VMs if it has not been added before', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const menuItems = await menu.getItems({ text: 'Add Trusted Platform Module' });
      expect(menuItems).toHaveLength(0);

      selectedInstance.set({
        id: 'my-instance',
        status: VirtualizationStatus.Stopped,
        type: VirtualizationType.Vm,
      });

      const newMenuItems = await menu.getItems({ text: 'Add Trusted Platform Module' });
      expect(newMenuItems).toHaveLength(1);
    });

    it('adds a TPM module when the corresponding option is selected', async () => {
      selectedInstance.set({
        id: 'my-instance',
        status: VirtualizationStatus.Stopped,
        type: VirtualizationType.Vm,
      });

      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      await menu.clickItem({ text: 'Add Trusted Platform Module' });

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_add', ['my-instance', {
        dev_type: VirtualizationDeviceType.Tpm,
      } as VirtualizationDevice]);
    });

    it('does not allow TPM to be added if instance is running', async () => {
      selectedInstance.set({
        id: 'my-instance',
        status: VirtualizationStatus.Running,
        type: VirtualizationType.Vm,
      });

      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const menuItems = await menu.getItems({ text: 'Add Trusted Platform Module' });
      expect(await menuItems[0].isDisabled()).toBe(true);
    });
  });
});
