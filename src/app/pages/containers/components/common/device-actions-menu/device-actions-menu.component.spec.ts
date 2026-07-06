import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconButtonHarness, TnMenuHarness, TnMenuTesting } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType } from 'app/enums/container.enum';
import {
  ContainerDevice,
} from 'app/interfaces/container.interface';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ContainerFilesystemDeviceFormComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-device-form/container-filesystem-device-form.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('DeviceActionsMenuComponent', () => {
  let spectator: Spectator<DeviceActionsMenuComponent>;
  let loader: HarnessLoader;
  const selectedContainer = signal(fakeContainer({
    id: 1,
  }));
  const createComponent = createComponentFactory({
    component: DeviceActionsMenuComponent,
    providers: [
      mockAuth(),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success(false)),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
      }),
      mockApi([
        mockCall('container.device.delete'),
      ]),
      mockProvider(ContainersStore, {
        selectedContainer,
        reload: jest.fn(),
      }),
      mockProvider(ContainerDevicesStore, {
        loadDevices: jest.fn(),
        deviceDeleted: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        device: {
          id: 123,
          dtype: ContainerDeviceType.Usb,
          usb: {
            vendor_id: '1234',
            product_id: '5678',
          },
          device: null,
        } as ContainerDevice,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function openMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnIconButtonHarness);
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  describe('delete', () => {
    it('deletes a device with confirmation and reloads the store when Delete item is selected', async () => {
      const menu = await openMenu();
      await menu.clickItem({ label: 'Delete' });

      expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
        title: 'Delete Item',
        message: 'Are you sure you want to delete USB 1234:5678?',
        call: expect.any(Function),
        successMessage: 'Device was deleted',
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.delete', [123]);
      expect(spectator.inject(ContainerDevicesStore).deviceDeleted).toHaveBeenCalledWith(123);
    });
  });

  describe('edit', () => {
    it('emits an edit event for non-storage devices when the Edit item is selected', async () => {
      jest.spyOn(spectator.component.edit, 'emit');

      const menu = await openMenu();
      await menu.clickItem({ label: 'Edit' });

      expect(spectator.component.edit.emit).toHaveBeenCalled();
    });

    it('opens filesystem device form for filesystem devices when the Edit item is selected', async () => {
      spectator.setInput('device', {
        id: 456,
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/tank/dataset',
        target: '/data',
      } as ContainerDevice);

      const menu = await openMenu();
      await menu.clickItem({ label: 'Edit' });

      // Verify that the form was opened in a side panel via FormSidePanelService.
      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
        ContainerFilesystemDeviceFormComponent,
        expect.objectContaining({
          inputs: expect.objectContaining({ disk: expect.objectContaining({ id: 456 }) }),
        }),
      );
    });

    it('does not show the Edit item when showEdit is false', async () => {
      spectator.setInput('showEdit', false);

      const menu = await openMenu();
      const items = await menu.getItemLabels();
      expect(items).not.toContain('Edit');
    });
  });
});
