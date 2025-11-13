import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType, ContainerNicDeviceType } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddNicMenuComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-nic-devices/add-nic-menu/add-nic-menu.component';
import { InstanceNicFormDialog } from 'app/pages/instances/components/common/instance-nic-form-dialog/instance-nic-form-dialog.component';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

describe('AddNicMenuComponent', () => {
  let spectator: Spectator<AddNicMenuComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddNicMenuComponent,
    providers: [
      mockApi([
        mockCall('container.device.nic_attach_choices', {
          truenasbr0: 'TrueNAS Bridge',
          ens1: 'Intel E1000',
        }),
        mockCall('container.device.create'),
      ]),
      mockProvider(ContainerInstancesStore, {
        selectedInstance: () => ({ id: 123 }),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of({ useDefault: true, trust_guest_rx_filters: false })),
        })),
      }),
      mockProvider(ContainerDevicesStore, {
        devices: () => [
          {
            dtype: ContainerDeviceType.Nic,
            nic_attach: 'already-added',
          },
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

  it('shows available NIC devices in a single list', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    expect(menuItems).toHaveLength(2);
    expect(await menuItems[0].getText()).toContain('TrueNAS Bridge');
    expect(await menuItems[1].getText()).toContain('Intel E1000');
  });

  it('adds a NIC device with selected type when it is selected', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    (spectator.inject(MatDialog).open as jest.Mock) = jest.fn(() => ({
      afterClosed: jest.fn(() => of({
        useDefault: true,
        type: ContainerNicDeviceType.Virtio,
        trust_guest_rx_filters: false,
      })),
    }));

    await menu.clickItem({ text: 'TrueNAS Bridge' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(InstanceNicFormDialog, {
      data: 'truenasbr0',
      minWidth: '500px',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
      container: 123,
      attributes: {
        dtype: ContainerDeviceType.Nic,
        type: ContainerNicDeviceType.Virtio,
        nic_attach: 'truenasbr0',
        trust_guest_rx_filters: false,
      } as ContainerDevice,
    }]);
    expect(spectator.inject(ContainerDevicesStore).loadDevices).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('NIC Device was added');
  });

  it('adds a NIC device without trust_guest_rx_filters when E1000 is selected', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    (spectator.inject(MatDialog).open as jest.Mock) = jest.fn(() => ({
      afterClosed: jest.fn(() => of({
        useDefault: true,
        type: ContainerNicDeviceType.E1000,
        // Note: trust_guest_rx_filters should NOT be included for E1000
      })),
    }));

    await menu.clickItem({ text: 'TrueNAS Bridge' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
      container: 123,
      attributes: {
        dtype: ContainerDeviceType.Nic,
        type: ContainerNicDeviceType.E1000,
        nic_attach: 'truenasbr0',
        // trust_guest_rx_filters should NOT be present for E1000
      } as ContainerDevice,
    }]);
  });
});
