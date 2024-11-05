import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  VmDeviceType, VmDiskMode, VmDisplayType, VmNicType,
} from 'app/enums/vm.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import {
  VmDevice,
  VmDiskDevice,
  VmDisplayDevice,
  VmPassthroughDeviceChoice,
  VmPciPassthroughDevice,
  VmUsbPassthroughDevice,
  VmRawFileDevice,
  VmUsbPassthroughDeviceChoice,
} from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { SlideInService } from 'app/services/slide-in.service';
import { VmService } from 'app/services/vm.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DeviceFormComponent', () => {
  let spectator: Spectator<DeviceFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let saveButton: MatButtonHarness;
  let websocket: WebSocketService;
  const createComponent = createComponentFactory({
    component: DeviceFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('vm.device.create'),
        mockCall('vm.device.update'),
        mockCall('vm.get_display_devices', [{}, {}] as VmDisplayDevice[]),
        mockCall('vm.device.bind_choices', {
          '0.0.0.0': '0.0.0.0',
          '::': '::',
        }),
        mockCall('vm.resolution_choices', {
          '640x480': '640x480',
          '800x600': '800x600',
          '1024x768': '1024x768',
        }),
        mockCall('vm.device.usb_passthrough_choices', {
          usb_device_1: {
            capability: { product: 'prod_1', vendor: 'vendor_1' },
          } as VmUsbPassthroughDeviceChoice,
          usb_device_2: {
            capability: { product: 'prod_2', vendor: 'vendor_2' },
          } as VmUsbPassthroughDeviceChoice,
        }),
        mockCall('vm.device.passthrough_device_choices', {
          pci_0000_00_1c_0: {
            reset_mechanism_defined: true,
          } as VmPassthroughDeviceChoice,
          pci_0000_00_1c_5: {
            reset_mechanism_defined: false,
          } as VmPassthroughDeviceChoice,
        }),
        mockCall('vm.random_mac', '00:a0:98:30:09:90'),
        mockCall('vm.device.nic_attach_choices', {
          enp0s3: 'enp0s3',
          enp0s4: 'enp0s4',
        }),
        mockCall('vm.device.disk_choices', {
          '/dev/zvol/bassein/zvol1': 'bassein/zvol1',
          '/dev/zvol/bassein/zvol+with+spaces': 'bassein/zvol with spaces',
        }),
        mockCall('vm.device.usb_controller_choices', {
          'piix3-uhci': 'piix3-uhci',
          'pci-ohci': 'pci-ohci',
        }),
        mockCall('system.advanced.config', {
          isolated_gpu_pci_ids: ['pci_0000_00_1c_0'],
        } as AdvancedConfig),
      ]),
      mockAuth(),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService),
      mockProvider(FilesystemService),
      mockProvider(SlideInRef),
      mockProvider(VmService, {
        hasVirtualizationSupport$: of(true),
      }),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('CD-ROM', () => {
    const existingCdRom = {
      id: 5,
      dtype: VmDeviceType.Cdrom,
      attributes: {
        path: '/mnt/bassein/cdrom',
      },
      order: 4,
      vm: 1,
    } as VmDevice;

    describe('add new', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('adds a new CD-ROM device', async () => {
        await form.fillForm({
          Type: 'CD-ROM',
          'CD-ROM Path': '/mnt/cdrom',
          'Device Order': 1002,
        });

        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
          dtype: VmDeviceType.Cdrom,
          attributes: { path: '/mnt/cdrom' },
          order: 1002,
          vm: 45,
        }]);
        expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      });
    });

    describe('edit', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
                device: existingCdRom,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('shows values for an existing CD-ROM device', async () => {
        const values = await form.getValues();
        expect(values).toEqual({
          'CD-ROM Path': '/mnt/bassein/cdrom',
          'Device Order': '4',
        });
      });

      it('updates an existing CD-ROM device', async () => {
        await form.fillForm({
          'CD-ROM Path': '/mnt/newcdrom',
        });
        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [5, {
          attributes: { path: '/mnt/newcdrom' },
          dtype: VmDeviceType.Cdrom,
          order: 4,
          vm: 45,
        }]);
      });
    });
  });

  describe('NIC', () => {
    const existingNic = {
      id: 2,
      dtype: VmDeviceType.Nic,
      attributes: {
        type: 'E1000',
        mac: '00:a0:98:53:a5:ac',
        nic_attach: 'enp0s3',
        trust_guest_rx_filters: false,
      },
      order: 1002,
      vm: 1,
    } as VmDevice;

    describe('adds new', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('adds a new NIC device', async () => {
        await form.fillForm(
          {
            Type: 'NIC',
            'Adapter Type': 'VirtIO',
            'NIC To Attach': 'enp0s4',
            'Device Order': 1006,
            'Trust Guest Filters': true,
          },
        );

        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            mac: '00:a0:98:30:09:90',
            nic_attach: 'enp0s4',
            type: VmNicType.Virtio,
            trust_guest_rx_filters: true,
          },
          dtype: VmDeviceType.Nic,
          order: 1006,
          vm: 45,
        }]);
      });

      it('generate a new MAC when Type is selected', async () => {
        await form.fillForm({
          Type: 'NIC',
        });

        const values = await form.getValues();
        expect(values).toMatchObject({
          'MAC Address': '00:a0:98:30:09:90',
        });
        expect(websocket.call).toHaveBeenLastCalledWith('vm.random_mac');
      });

      it('generates a new MAC when Generate button is pressed', async () => {
        await form.fillForm({
          Type: 'NIC',
        });
        spectator.inject(MockWebSocketService).call.mockClear();

        const generateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Generate' }));
        await generateButton.click();

        const values = await form.getValues();
        expect(values).toMatchObject({
          'MAC Address': '00:a0:98:30:09:90',
        });
        expect(websocket.call).toHaveBeenLastCalledWith('vm.random_mac');
      });
    });

    describe('edits', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
                device: existingNic,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('shows values for an existing NIC device', async () => {
        const values = await form.getValues();
        expect(values).toEqual({
          'Adapter Type': 'Intel e82585 (e1000)',
          'Device Order': '1002',
          'MAC Address': '00:a0:98:53:a5:ac',
          'NIC To Attach': 'enp0s3',
          'Trust Guest Filters': false,
        });
      });
    });
  });

  describe('Disk', () => {
    const existingDisk = {
      id: 3,
      dtype: VmDeviceType.Disk,
      attributes: {
        path: '/dev/zvol/bassein/zvol1',
        type: VmDiskMode.Ahci,
        physical_sectorsize: 4096,
        logical_sectorsize: 4096,
      },
      order: 1001,
      vm: 45,
    } as VmDiskDevice;

    describe('adds disk', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('adds a new disk', async () => {
        await form.fillForm(
          {
            Type: 'Disk',
            Zvol: 'bassein/zvol1',
            Mode: 'VirtIO',
            'Disk Sector Size': '512',
            'Device Order': '1002',
          },
        );

        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: 512,
            physical_sectorsize: 512,
            path: '/dev/zvol/bassein/zvol1',
            type: VmDiskMode.Virtio,
          },
          dtype: VmDeviceType.Disk,
          order: 1002,
          vm: 45,
        }]);
      });
    });

    describe('edits disk', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
                device: existingDisk,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('shows values for an existing Disk', async () => {
        const values = await form.getValues();
        expect(values).toEqual({
          Zvol: 'bassein/zvol1',
          'Disk Sector Size': '4096',
          Mode: VmDiskMode.Ahci,
          'Device Order': '1001',
        });
      });

      it('updates an existing Disk', async () => {
        await form.fillForm({
          Mode: 'AHCI',
          'Disk Sector Size': 'Default',
        });

        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [3, {
          attributes: {
            logical_sectorsize: null,
            physical_sectorsize: null,
            path: '/dev/zvol/bassein/zvol1',
            type: VmDiskMode.Ahci,
          },
          dtype: VmDeviceType.Disk,
          order: 1001,
          vm: 45,
        }]);
      });
    });
  });

  describe('Raw File', () => {
    const existingRawFile = {
      id: 6,
      dtype: VmDeviceType.Raw,
      attributes: {
        path: '/mnt/bassein/raw',
        type: VmDiskMode.Ahci,
        size: 3,
        logical_sectorsize: null,
        physical_sectorsize: null,
        boot: false,
      },
      order: 5,
      vm: 45,
    } as VmRawFileDevice;

    describe('adds raw file', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('adds a new Raw File device', async () => {
        await form.fillForm(
          {
            Type: 'Raw File',
            'Raw File': '/mnt/bassein/newraw',
            'Disk Sector Size': '512',
            Mode: 'AHCI',
            'Raw Filesize': 3,
            'Device Order': '6',
          },
        );
        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: 512,
            physical_sectorsize: 512,
            path: '/mnt/bassein/newraw',
            size: 3,
            type: VmDiskMode.Ahci,
          },
          dtype: VmDeviceType.Raw,
          order: 6,
          vm: 45,
        }]);
      });
    });

    describe('edits raw file', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
                device: existingRawFile,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('shows values for an existing Raw File device', async () => {
        const values = await form.getValues();

        expect(values).toEqual({
          'Raw File': '/mnt/bassein/raw',
          'Disk Sector Size': 'Default',
          Mode: 'AHCI',
          'Raw Filesize': '3',
          'Device Order': '5',
        });
      });

      it('updates an existing Raw File device', async () => {
        await form.fillForm({
          'Raw Filesize': 5,
        });
        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [6, {
          attributes: {
            path: '/mnt/bassein/raw',
            logical_sectorsize: null,
            physical_sectorsize: null,
            size: 5,
            type: VmDiskMode.Ahci,
          },
          dtype: VmDeviceType.Raw,
          order: 5,
          vm: 45,
        }]);
      });
    });
  });

  describe('PCI Passthrough Device', () => {
    const existingPassthrough = {
      id: 4,
      dtype: VmDeviceType.Pci,
      attributes: {
        pptdev: 'pci_0000_00_1c_0',
      },
      order: 5,
      vm: 45,
    } as VmPciPassthroughDevice;

    describe('adds PCI Passthrough Device', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('adds a new PCI Passthrough device', async () => {
        await form.fillForm(
          {
            Type: 'PCI Passthrough Device',
            'PCI Passthrough Device': 'pci_0000_00_1c_0',
            'Device Order': '6',
          },
        );
        await saveButton.click();

        expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            pptdev: 'pci_0000_00_1c_0',
          },
          dtype: VmDeviceType.Pci,
          order: 6,
          vm: 45,
        }]);
      });
    });

    describe('edits PCI Passthrough Device', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
                device: existingPassthrough,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('shows values for an existing PCI Passthrough device', async () => {
        const values = await form.getValues();
        expect(values).toEqual({
          'PCI Passthrough Device': 'pci_0000_00_1c_0',
          'Device Order': '5',
        });
      });

      it('updates an existing PCI Passthrough device', async () => {
        await form.fillForm({
          'PCI Passthrough Device': 'pci_0000_00_1c_5',
        });
        await saveButton.click();

        expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Warning',
            message: 'PCI device does not have a reset mechanism defined and you may experience inconsistent/degraded behavior when starting/stopping the VM.',
          }),
        );

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [4, {
          attributes: {
            pptdev: 'pci_0000_00_1c_5',
          },
          dtype: VmDeviceType.Pci,
          order: 5,
          vm: 45,
        }]);
      });
    });
  });

  describe('Display', () => {
    const existingDisplay = {
      id: 1,
      dtype: VmDeviceType.Display,
      attributes: {
        bind: '0.0.0.0',
        password: '12345678910',
        web: true,
        type: VmDisplayType.Spice,
        resolution: '1024x768',
        port: 5900,
      },
      order: 1002,
      vm: 45,
    } as VmDisplayDevice;

    describe('edits display', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
                device: existingDisplay,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('shows values for an existing Display device', async () => {
        const values = await form.getValues();
        expect(values).toEqual({
          Bind: '0.0.0.0',
          'Device Order': '1002',
          Password: '12345678910',
          Port: '5900',
          Resolution: '1024x768',
          'Web Interface': true,
        });
      });
    });

    describe('edits display to 46', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 46,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('hides Display type option when VM already has 2 or more displays (proxy for having 1 display of each type)', async () => {
        spectator.inject(MockWebSocketService).mockCall('vm.get_display_devices', [{}, {}] as VmDisplayDevice[]);
        const typeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Type' }));
        expect(websocket.call).toHaveBeenCalledWith('vm.get_display_devices', [46]);
        expect(await typeSelect.getOptionLabels()).not.toContain('Display');
      });
    });
  });

  describe('USB Passthrough Device', () => {
    const existingUsb = {
      id: 1,
      dtype: VmDeviceType.Usb,
      attributes: {
        controller_type: 'pci-ohci',
        device: 'usb_device_2',
      },
      order: 7,
      vm: 45,
    } as VmUsbPassthroughDevice;

    describe('adds USB Passthrough Device', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('adds a new USB Passthrough device', async () => {
        await form.fillForm(
          {
            Type: 'USB Passthrough Device',
            'Controller Type': 'pci-ohci',
            Device: 'usb_device_2 prod_2 (vendor_2)',
          },
        );
        await saveButton.click();

        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            controller_type: 'pci-ohci',
            device: 'usb_device_2',
          },
          dtype: VmDeviceType.Usb,
          order: null,
          vm: 45,
        }]);
      });
    });

    describe('edits USB Passthrough Device', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            {
              provide: SLIDE_IN_DATA,
              useValue: {
                virtualMachineId: 45,
                device: existingUsb,
              },
            },
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness);
        websocket = spectator.inject(WebSocketService);
      });

      it('shows values for an existing USB Passthrough device', async () => {
        const values = await form.getValues();
        expect(values).toEqual({
          'Controller Type': 'pci-ohci',
          Device: 'usb_device_2 prod_2 (vendor_2)',
          'Device Order': '7',
        });
      });

      it('updates an existing USB Passthrough when device is selected', async () => {
        await form.fillForm({
          'Controller Type': 'piix3-uhci',
          Device: 'usb_device_1 prod_1 (vendor_1)',
        });

        await saveButton.click();
        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [1, {
          attributes: {
            controller_type: 'piix3-uhci',
            device: 'usb_device_1',
          },
          dtype: VmDeviceType.Usb,
          order: 7,
          vm: 45,
        }]);
      });

      it('updates an existing USB Passthrough when custom is selected', async () => {
        await form.fillForm(
          {
            'Controller Type': 'piix3-uhci',
            Device: 'Specify custom',
            'Vendor ID': 'vendor_1',
            'Product ID': 'product_1',
          },
        );

        spectator.detectChanges();

        await saveButton.click();
        expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [1, {
          attributes: {
            controller_type: 'piix3-uhci',
            device: null,
            usb: {
              vendor_id: 'vendor_1',
              product_id: 'product_1',
            },
          },
          dtype: VmDeviceType.Usb,
          order: 7,
          vm: 45,
        }]);
      });
    });
  });
});
