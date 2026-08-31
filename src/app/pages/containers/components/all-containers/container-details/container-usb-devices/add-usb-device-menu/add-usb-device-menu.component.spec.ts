import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnMenuHarness, TnMenuTesting } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerStatus, ContainerType } from 'app/enums/container.enum';
import { AvailableUsb, ContainerDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddUsbDeviceMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-usb-devices/add-usb-device-menu/add-usb-device-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

describe('AddUsbDeviceMenuComponent', () => {
  const selectedContainer = signal({
    id: 123,
    type: ContainerType.Container,
  });

  const usbChoices = {
    usb_1_1: {
      capability: {
        vendor_id: '0x046d',
        product_id: '0x0001',
        product: 'Web Cam',
      },
      available: true,
      description: 'Web Cam',
    } as AvailableUsb,
    usb_1_2: {
      capability: {
        vendor_id: '0x0781',
        product_id: '0x0002',
        product: 'Card Reader',
      },
      available: true,
      description: 'Card Reader',
    } as AvailableUsb,
  };

  async function openSubmenu(
    spectator: Spectator<AddUsbDeviceMenuComponent>,
    loader: HarnessLoader,
    label: string,
  ): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await trigger.click();

    const rootLoader = TnMenuTesting.rootLoader(spectator.fixture);
    const menu = await rootLoader.getHarness(TnMenuHarness);
    await menu.clickItem({ label });

    const menus = await rootLoader.getAllHarnesses(TnMenuHarness);
    return menus[menus.length - 1];
  }

  describe('with available devices', () => {
    let spectator: Spectator<AddUsbDeviceMenuComponent>;
    let loader: HarnessLoader;
    const createComponent = createComponentFactory({
      component: AddUsbDeviceMenuComponent,
      providers: [
        mockAuth(),
        mockApi([
          mockCall('container.device.usb_choices', usbChoices),
          mockCall('container.device.create'),
        ]),
        mockProvider(ContainersStore, {
          selectedContainer,
        }),
        mockProvider(ContainerDevicesStore, {
          devices: () => [
            {
              dtype: ContainerDeviceType.Usb,
              usb: null,
              device: 'usb_1_1',
            } as ContainerDevice,
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

    it('shows available USB devices that have not been already added to this system', async () => {
      const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await trigger.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      const itemLabels = await menu.getItemLabels();
      expect(itemLabels).toHaveLength(1);
      expect(itemLabels[0]).toContain('Card Reader');
    });

    it('adds a usb device by physical port when By physical port is selected', async () => {
      const submenu = await openSubmenu(spectator, loader, 'Card Reader');
      await submenu.clickItem({ label: 'By physical port' });

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 123,
        attributes: {
          dtype: ContainerDeviceType.Usb,
          device: 'usb_1_2',
          usb: null,
        } as ContainerDevice,
      }]);
      expect(spectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('USB Device was added');
    });

    it('adds a usb device by vendor and product IDs when that option is selected', async () => {
      const submenu = await openSubmenu(spectator, loader, 'Card Reader');
      await submenu.clickItem({ label: 'By vendor and product ID' });

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 123,
        attributes: {
          dtype: ContainerDeviceType.Usb,
          device: null,
          usb: {
            vendor_id: '0x0781',
            product_id: '0x0002',
          },
        } as ContainerDevice,
      }]);
      expect(spectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('USB Device was added');
    });
  });

  describe('with a device recorded by vendor/product IDs', () => {
    const createComponent = createComponentFactory({
      component: AddUsbDeviceMenuComponent,
      providers: [
        mockAuth(),
        mockApi([
          mockCall('container.device.usb_choices', usbChoices),
        ]),
        mockProvider(ContainersStore, {
          selectedContainer,
        }),
        mockProvider(ContainerDevicesStore, {
          devices: () => [
            {
              dtype: ContainerDeviceType.Usb,
              usb: {
                vendor_id: '0x046d',
                product_id: '0x0001',
              },
              device: null,
            } as ContainerDevice,
          ] as ContainerDevice[],
          isLoading: () => false,
        }),
        mockProvider(SnackbarService),
      ],
    });

    it('excludes devices whose vendor and product IDs are already attached', async () => {
      const spectator = createComponent();
      const loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await trigger.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      const itemLabels = await menu.getItemLabels();
      expect(itemLabels).toHaveLength(1);
      expect(itemLabels[0]).toContain('Card Reader');
    });
  });

  // Middleware refuses device operations on any container that is not stopped, so Add has to
  // be gated like the per-device Edit/Delete menu instead of failing at submit.
  describe.each([ContainerStatus.Running, ContainerStatus.Suspended, ContainerStatus.Unknown])(
    'when the container is %s',
    (state) => {
      const createComponent = createComponentFactory({
        component: AddUsbDeviceMenuComponent,
        providers: [
          mockAuth(),
          mockApi([
            mockCall('container.device.usb_choices', {
              usb_1_2: {
                capability: { vendor_id: '0x0781', product_id: '0x0002', product: 'Card Reader' },
                available: true,
                description: 'Card Reader',
              } as AvailableUsb,
            }),
          ]),
          mockProvider(ContainersStore, {
            selectedContainer: () => ({ id: 123, status: { state } }),
          }),
          mockProvider(ContainerDevicesStore, {
            devices: () => [] as ContainerDevice[],
            isLoading: () => false,
          }),
          mockProvider(SnackbarService),
        ],
      });

      it('disables Add', async () => {
        const loader = TestbedHarnessEnvironment.loader(createComponent().fixture);

        const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
        expect(await trigger.isDisabled()).toBe(true);
      });
    },
  );

  describe('with no available devices', () => {
    let spectator: Spectator<AddUsbDeviceMenuComponent>;
    const createComponent = createComponentFactory({
      component: AddUsbDeviceMenuComponent,
      providers: [
        mockAuth(),
        mockApi([
          mockCall('container.device.usb_choices', {}),
        ]),
        mockProvider(ContainersStore, {
          selectedContainer,
        }),
        mockProvider(ContainerDevicesStore, {
          devices: () => [] as ContainerDevice[],
          isLoading: () => false,
        }),
        mockProvider(SnackbarService),
      ],
    });

    beforeEach(() => {
      spectator = createComponent();
    });

    it('shows "No USB devices available" when there are no devices to add', () => {
      expect(spectator.query(byText('No USB devices available'))).toExist();
    });
  });
});
