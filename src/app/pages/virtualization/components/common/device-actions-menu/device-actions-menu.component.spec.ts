import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/virtualization/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ApiService } from 'app/services/websocket/api.service';

describe('DeviceActionsMenuComponent', () => {
  let spectator: Spectator<DeviceActionsMenuComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeviceActionsMenuComponent,
    providers: [
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('virt.instance.device_delete'),
      ]),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: () => ({
          id: 'my-instance',
        }),
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        device: {
          name: 'my-device',
        } as VirtualizationDevice,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows menu as disabled for readonly devices', async () => {
    spectator.setInput('device', {
      name: 'my-device',
      readonly: true,
    } as VirtualizationDevice);

    const menu = await loader.getHarness(MatMenuHarness);
    expect(await menu.isDisabled()).toBe(true);
  });

  describe('delete', () => {
    it('deletes a device with confirmation and reloads the store when Delete item is selected', async () => {
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      await menu.clickItem({ text: 'Delete' });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_delete', ['my-instance', 'my-device']);
      expect(spectator.inject(VirtualizationInstancesStore).deviceDeleted).toHaveBeenCalledWith('my-device');
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
