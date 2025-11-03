import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceType } from 'app/enums/container.enum';
import {
  ContainerDeviceWithId,
} from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

describe('DeviceActionsMenuComponent', () => {
  let spectator: Spectator<DeviceActionsMenuComponent>;
  let loader: HarnessLoader;
  const selectedInstance = signal(fakeVirtualizationInstance({
    id: 1,
  }));
  const createComponent = createComponentFactory({
    component: DeviceActionsMenuComponent,
    providers: [
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('container.device.delete'),
      ]),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance,
      }),
      mockProvider(VirtualizationDevicesStore, {
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        device: {
          id: 123,
          name: 'my-device',
          dtype: ContainerDeviceType.Usb,
        } as ContainerDeviceWithId,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('disabled state', () => {
    it('shows menu as disabled for readonly devices', async () => {
      spectator.setInput('device', {
        name: 'my-device',
        readonly: true,
      } as ContainerDeviceWithId);

      const menu = await loader.getHarness(MatMenuHarness);
      expect(await menu.isDisabled()).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes a device with confirmation and reloads the store when Delete item is selected', async () => {
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      await menu.clickItem({ text: 'Delete' });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.delete', [123]);
      expect(spectator.inject(VirtualizationDevicesStore).deviceDeleted).toHaveBeenCalledWith(123);
    });
  });

  describe('edit', () => {
    it('emits an edit event when the Edit item is selected', async () => {
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      jest.spyOn(spectator.component.edit, 'emit');

      await menu.clickItem({ text: 'Edit' });

      expect(spectator.component.edit.emit).toHaveBeenCalled();
    });

    it('does not show the Edit item when showEdit is false', async () => {
      spectator.setInput('showEdit', false);

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      const items = await menu.getItems({ text: 'Edit' });
      expect(items).toHaveLength(0);
    });
  });
});
