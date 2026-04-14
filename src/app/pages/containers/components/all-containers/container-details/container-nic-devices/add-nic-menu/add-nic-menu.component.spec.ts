import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { byText } from '@ngneat/spectator';
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
        reload: jest.fn(),
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
    spectator = createComponent({ props: { defaultBridge: null } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows available NIC devices grouped by type', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    // Expects: "Bridged NICs" header (disabled), truenasbr0, "Macvlan NICs" header (disabled), ens1
    expect(menuItems.length).toBeGreaterThanOrEqual(4);

    const itemTexts = await Promise.all(menuItems.map((item) => item.getText()));
    expect(itemTexts).toContain('Bridged NICs');
    expect(itemTexts).toContain('truenasbr0');
    expect(itemTexts).toContain('Macvlan NICs');
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
      })),
    }));

    await menu.clickItem({ text: 'truenasbr0' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
      container: 123,
      attributes: {
        dtype: ContainerDeviceType.Nic,
        type: ContainerNicDeviceType.E1000,
        nic_attach: 'truenasbr0',
      } as ContainerDevice,
    }]);
  });
});

describe('AddNicMenuComponent - Default Bridge Filtering', () => {
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
      ]),
      mockProvider(ContainersStore, {
        selectedContainer: () => ({ id: 123 }),
        reload: jest.fn(),
      }),
      mockProvider(ContainerDevicesStore, {
        devices: () => [] as ContainerDevice[],
        isLoading: () => false,
      }),
      mockProvider(MatDialog),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({ props: { defaultBridge: 'truenasbr0' } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('excludes default bridge from available choices when no NICs are explicitly configured', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    const itemTexts = await Promise.all(menuItems.map((item) => item.getText()));

    expect(itemTexts).not.toContain('truenasbr0');
    expect(itemTexts).toContain('ens1');
  });
});

describe('AddNicMenuComponent - No NICs Available', () => {
  let spectator: Spectator<AddNicMenuComponent>;

  const createComponent = createComponentFactory({
    component: AddNicMenuComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.nic_attach_choices', {}),
      ]),
      mockProvider(ContainersStore, {
        selectedContainer: () => ({ id: 123 }),
        reload: jest.fn(),
      }),
      mockProvider(ContainerDevicesStore, {
        devices: () => [] as ContainerDevice[],
        isLoading: () => false,
      }),
      mockProvider(MatDialog),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({ props: { defaultBridge: null } });
  });

  it('shows "No NIC devices available" when there are no NICs to add', () => {
    expect(spectator.query(byText('No NIC devices available'))).toExist();
  });
});

describe('AddNicMenuComponent - NIC Deduplication', () => {
  let spectator: Spectator<AddNicMenuComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AddNicMenuComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.nic_attach_choices', {
          BRIDGE: ['eth0', 'truenasbr0'],
          MACVLAN: ['eth0', 'ens1'],
        }),
      ]),
      mockProvider(ContainersStore, {
        selectedContainer: () => ({ id: 123 }),
        reload: jest.fn(),
      }),
      mockProvider(ContainerDevicesStore, {
        devices: () => [] as ContainerDevice[],
        isLoading: () => false,
      }),
      mockProvider(MatDialog),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({ props: { defaultBridge: null } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deduplicates NICs that appear in multiple groups', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    const itemTexts = await Promise.all(menuItems.map((item) => item.getText()));

    // eth0 should only appear once (in the first group where it's encountered)
    const eth0Count = itemTexts.filter((text) => text === 'eth0').length;
    expect(eth0Count).toBe(1);

    // Verify eth0 appears in BRIDGE group (first group processed)
    const bridgeIndex = itemTexts.indexOf('Bridged NICs');
    const macvlanIndex = itemTexts.indexOf('Macvlan NICs');
    const eth0Index = itemTexts.indexOf('eth0');

    expect(eth0Index).toBeGreaterThan(bridgeIndex);
    expect(eth0Index).toBeLessThan(macvlanIndex);
  });
});
