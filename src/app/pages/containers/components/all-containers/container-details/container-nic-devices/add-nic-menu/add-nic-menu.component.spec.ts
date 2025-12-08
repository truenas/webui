import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerNicDeviceType } from 'app/enums/container.enum';
import { ContainerDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddNicMenuComponent } from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/add-nic-menu/add-nic-menu.component';
import { ContainerNicFormDialog } from 'app/pages/containers/components/common/container-nic-form-dialog/container-nic-form-dialog.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

describe('AddNicMenuComponent', () => {
  let spectator: Spectator<AddNicMenuComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddNicMenuComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.nic_attach_choices', {
          BRIDGE: ['truenasbr0'],
          MACVLAN: ['ens1'],
        }),
        mockCall('container.device.create'),
      ]),
      mockProvider(ContainersStore, {
        selectedContainer: () => ({ id: 123 }),
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
        reload: jest.fn(),
        isLoading: () => false,
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows available NIC devices grouped by type', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    // Expects: "Bridged Devices" header (disabled), truenasbr0, "MACVLAN Devices" header (disabled), ens1
    expect(menuItems.length).toBeGreaterThanOrEqual(4);

    const itemTexts = await Promise.all(menuItems.map((item) => item.getText()));
    expect(itemTexts).toContain('Bridged Devices');
    expect(itemTexts).toContain('truenasbr0');
    expect(itemTexts).toContain('MACVLAN Devices');
    expect(itemTexts).toContain('ens1');
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

    await menu.clickItem({ text: 'truenasbr0' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ContainerNicFormDialog, {
      data: { nic: 'truenasbr0' },
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
    expect(spectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
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

    await menu.clickItem({ text: 'truenasbr0' });

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
