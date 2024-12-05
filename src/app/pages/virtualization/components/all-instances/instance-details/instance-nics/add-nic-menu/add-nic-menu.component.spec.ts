import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDeviceType, VirtualizationNicType } from 'app/enums/virtualization.enum';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AddNicMenuComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-nics/add-nic-menu/add-nic-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { ApiService } from 'app/services/websocket/api.service';

describe('AddNicMenuComponent', () => {
  let spectator: Spectator<AddNicMenuComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddNicMenuComponent,
    providers: [
      mockApi([
        mockCall('virt.device.nic_choices', {
          nic1: 'Intel E1000',
          nic2: 'Realtek RTL8139',
        }),
        mockCall('virt.instance.device_add'),
      ]),
      mockProvider(VirtualizationDevicesStore, {
        selectedInstance: () => ({ id: 'my-instance' }),
        devices: () => [
          {
            dev_type: VirtualizationDeviceType.Nic,
            nic_type: VirtualizationNicType.Macvlan,
            parent: 'already-added',
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

  it('shows available NIC devices that have not been already added to this system', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    const menuItems = await menu.getItems();
    expect(menuItems).toHaveLength(4);
    expect(await menuItems[0].getText()).toContain('Intel E1000');
    expect(await menuItems[1].getText()).toContain('Realtek RTL8139');
  });

  it('adds a NIC device when it is selected', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
    await menu.open();

    await menu.clickItem({ text: 'Intel E1000' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_add', ['my-instance', {
      dev_type: VirtualizationDeviceType.Nic,
      nic_type: VirtualizationNicType.Bridged,
      parent: 'Intel E1000',
    } as VirtualizationDevice]);
    expect(spectator.inject(VirtualizationDevicesStore).loadDevices).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('NIC was added');
  });
});
