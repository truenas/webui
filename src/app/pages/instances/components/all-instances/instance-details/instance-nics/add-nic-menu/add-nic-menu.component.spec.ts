import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType, ContainerNicType } from 'app/enums/container.enum';
import { VirtualizationDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddNicMenuComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-nics/add-nic-menu/add-nic-menu.component';
import { InstanceNicMacDialog } from 'app/pages/instances/components/common/instance-nics-mac-addr-dialog/instance-nic-mac-dialog.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('AddNicMenuComponent', () => {
  let spectator: Spectator<AddNicMenuComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddNicMenuComponent,
    providers: [
      mockApi([
        mockCall('container.device.nic_attach_choices', {
          nic1: 'Intel E1000',
          nic2: 'Realtek RTL8139',
        }),
        mockCall('container.device.create'),
      ]),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: () => ({ id: 'my-instance' }),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of({ useDefault: true })),
        })),
      }),
      mockProvider(VirtualizationDevicesStore, {
        devices: () => [
          {
            dev_type: ContainerDeviceType.Nic,
            nic_type: ContainerNicType.Macvlan,
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

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(InstanceNicMacDialog, {
      data: 'Intel E1000',
      minWidth: '500px',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
      container: 'my-instance',
      attributes: {
        dev_type: ContainerDeviceType.Nic,
        nic_type: ContainerNicType.Bridged,
        parent: 'Intel E1000',
      } as VirtualizationDevice,
    }]);
    expect(spectator.inject(VirtualizationDevicesStore).loadDevices).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('NIC was added');
  });
});
