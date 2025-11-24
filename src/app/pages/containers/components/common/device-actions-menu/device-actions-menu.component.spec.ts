import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType } from 'app/enums/container.enum';
import {
  ContainerDevice,
} from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
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
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: Observable<unknown>) => source$),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: false })),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
      }),
      mockApi([
        mockCall('container.device.delete'),
      ]),
      mockProvider(ContainersStore, {
        selectedContainer,
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

  describe('delete', () => {
    it('deletes a device with confirmation and reloads the store when Delete item is selected', async () => {
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      await menu.clickItem({ text: 'Delete' });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.delete', [123]);
      expect(spectator.inject(ContainerDevicesStore).deviceDeleted).toHaveBeenCalledWith(123);
    });
  });

  describe('edit', () => {
    it('emits an edit event for non-storage devices when the Edit item is selected', async () => {
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      jest.spyOn(spectator.component.edit, 'emit');

      await menu.clickItem({ text: 'Edit' });

      expect(spectator.component.edit.emit).toHaveBeenCalled();
    });

    it('opens filesystem device form for filesystem devices when the Edit item is selected', async () => {
      spectator.setInput('device', {
        id: 456,
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/tank/dataset',
        target: '/data',
      } as ContainerDevice);

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      jest.spyOn(spectator.inject(SlideIn), 'open');

      await menu.clickItem({ text: 'Edit' });

      // Verify that the SlideIn service was called to open the form
      expect(spectator.inject(SlideIn).open).toHaveBeenCalled();
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
