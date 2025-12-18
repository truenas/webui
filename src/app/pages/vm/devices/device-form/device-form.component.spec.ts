import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JsonRpcErrorCode, ApiErrorName } from 'app/enums/api.enum';
import {
  VmDeviceType, VmDiskMode, VmDisplayType, VmNicType,
} from 'app/enums/vm.enum';
import { transformApiCallErrorMessage } from 'app/helpers/api.helper';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
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
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import { ApiCallError } from 'app/services/errors/error.classes';
import { FilesystemService } from 'app/services/filesystem.service';
import { VmService } from 'app/services/vm.service';

const threeGibibytes = 3 * (2 ** 30);
const tenGibibytes = 10 * (2 ** 30);

describe('DeviceFormComponent', () => {
  let spectator: Spectator<DeviceFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let saveButton: MatButtonHarness;
  let api: ApiService;

  const slideInRef: SlideInRef<{ virtualMachineId: number; device: VmDevice } | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: DeviceFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('vm.device.create'),
        mockCall('vm.device.update'),
        mockCall('vm.get_display_devices', [
          { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Spice } },
          { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Vnc } },
        ] as VmDisplayDevice[]),
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
          BRIDGE: ['enp0s3'],
          MACVLAN: ['enp0s4'],
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
      mockProvider(SlideIn),
      mockProvider(FilesystemService),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(VmService, {
        hasVirtualizationSupport$: of(true),
      }),
      // we can only detect whether or not validation errors are being handled
      // correctly if we mock the `FormErrorHandlerService`
      mockProvider(FormErrorHandlerService),
    ],
  });

  describe('CD-ROM', () => {
    const existingCdRom = {
      id: 5,
      attributes: {
        dtype: VmDeviceType.Cdrom,
        path: '/mnt/bassein/cdrom',
      },
      order: 4,
      vm: 1,
    } as VmDevice;

    describe('add new', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('adds a new CD-ROM device', async () => {
        await form.fillForm({
          Type: 'CD-ROM',
          'CD-ROM Path': '/mnt/cdrom',
          'Device Order': 1002,
        });

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            path: '/mnt/cdrom',
            dtype: VmDeviceType.Cdrom,
          },
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
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({ virtualMachineId: 45, device: existingCdRom })),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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
        spectator.component.cdromForm.markAsDirty();
        spectator.detectChanges();
        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [5, {
          attributes: {
            path: '/mnt/newcdrom',
            dtype: VmDeviceType.Cdrom,
          },
          order: 4,
          vm: 45,
        }]);
      });
    });
  });

  describe('NIC', () => {
    const existingNic = {
      id: 2,
      attributes: {
        type: 'E1000',
        mac: '00:a0:98:53:a5:ac',
        nic_attach: 'enp0s3',
        trust_guest_rx_filters: false,
        dtype: VmDeviceType.Nic,
      },
      order: 1002,
      vm: 1,
    } as VmDevice;

    describe('adds new', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            mac: '00:a0:98:30:09:90',
            nic_attach: 'enp0s4',
            type: VmNicType.Virtio,
            trust_guest_rx_filters: true,
            dtype: VmDeviceType.Nic,
          },
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
        expect(api.call).toHaveBeenLastCalledWith('vm.random_mac');
      });

      it('generates a new MAC when Generate button is pressed', async () => {
        await form.fillForm({
          Type: 'NIC',
        });
        spectator.inject(MockApiService).call.mockClear();

        const generateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Generate' }));
        await generateButton.click();

        const values = await form.getValues();
        expect(values).toMatchObject({
          'MAC Address': '00:a0:98:30:09:90',
        });
        expect(api.call).toHaveBeenLastCalledWith('vm.random_mac');
      });
    });

    describe('edits', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({
                virtualMachineId: 45,
                device: existingNic,
              })),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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
      attributes: {
        dtype: VmDeviceType.Disk,
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
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: 512,
            physical_sectorsize: 512,
            path: '/dev/zvol/bassein/zvol1',
            type: VmDiskMode.Virtio,
            dtype: VmDeviceType.Disk,
          },
          order: 1002,
          vm: 45,
        }]);
      });
    });

    describe('edits disk', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({ virtualMachineId: 45, device: existingDisk })),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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

        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [3, {
          attributes: {
            logical_sectorsize: null,
            physical_sectorsize: null,
            path: '/dev/zvol/bassein/zvol1',
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Disk,
          },
          order: 1001,
          vm: 45,
        }]);
      });
    });
  });

  describe('Raw File', () => {
    const existingRawFile = {
      id: 6,
      attributes: {
        dtype: VmDeviceType.Raw,
        path: '/mnt/bassein/raw',
        type: VmDiskMode.Ahci,
        size: threeGibibytes,
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
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('adds a new Raw File device', async () => {
        await form.fillForm(
          {
            Type: 'Raw File',
            'Raw File': '/mnt/bassein/newraw',
            'Disk Sector Size': '512',
            Mode: 'AHCI',
            'Raw Filesize': '3 GiB',
            'Device Order': '6',
          },
        );
        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: 512,
            physical_sectorsize: 512,
            path: '/mnt/bassein/newraw',
            size: threeGibibytes,
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Raw,
          },
          order: 6,
          vm: 45,
        }]);
      });
    });

    describe('edits raw file', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({ virtualMachineId: 45, device: existingRawFile })),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('shows values for an existing Raw File device', async () => {
        const values = await form.getValues();

        expect(values).toEqual({
          'Raw File': '/mnt/bassein/raw',
          'Disk Sector Size': 'Default',
          Mode: 'AHCI',
          'Raw Filesize': '3 GiB',
          'Device Order': '5',
        });
      });

      it('updates an existing Raw File device', async () => {
        await form.fillForm({
          'Raw Filesize': '10 GiB',
        });
        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [6, {
          attributes: {
            path: '/mnt/bassein/raw',
            logical_sectorsize: null,
            physical_sectorsize: null,
            size: tenGibibytes,
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Raw,
            exists: true,
          },
          order: 5,
          vm: 45,
        }]);
      });

      it('sets exists field to true when editing existing raw file device', () => {
        expect(spectator.component.rawFileForm.value.exists).toBe(true);
      });

      it('still submits null when size box contains whitespace', async () => {
        await form.fillForm({
          'Raw Filesize': '   \n\t',
        });
        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [6, {
          attributes: {
            path: '/mnt/bassein/raw',
            logical_sectorsize: null,
            physical_sectorsize: null,
            size: null,
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Raw,
            exists: true,
          },
          order: 5,
          vm: 45,
        }]);
      });
    });

    describe('adds raw file with existing file', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('includes exists: true when selecting existing file from path input', async () => {
        await form.fillForm(
          {
            Type: 'Raw File',
            'Raw File': '/mnt/bassein/existingfile.raw',
            'Disk Sector Size': 'Default',
            Mode: 'AHCI',
            'Device Order': '7',
          },
        );

        // Manually trigger path change to simulate file selection
        spectator.component.rawFileForm.patchValue({ path: '/mnt/bassein/existingfile.raw' });
        spectator.detectChanges();

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: null,
            physical_sectorsize: null,
            path: '/mnt/bassein/existingfile.raw',
            size: null,
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Raw,
            exists: true,
          },
          order: 7,
          vm: 45,
        }]);
      });
    });

    describe('adds raw file with size (new file creation)', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('does not include exists field when creating new file with size specified', async () => {
        await form.fillForm(
          {
            Type: 'Raw File',
            'Raw File': '/mnt/bassein/newfile.raw',
            'Disk Sector Size': 'Default',
            Mode: 'AHCI',
            'Raw Filesize': '10 GiB',
            'Device Order': '8',
          },
        );

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: null,
            physical_sectorsize: null,
            path: '/mnt/bassein/newfile.raw',
            size: tenGibibytes,
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Raw,
            // exists should NOT be present
          },
          order: 8,
          vm: 45,
        }]);

        // Verify exists is not in the attributes
        const callArgs = (api.call as jest.Mock).mock.calls[
          (api.call as jest.Mock).mock.calls.length - 1
        ][1][0];
        expect(callArgs.attributes).not.toHaveProperty('exists');
      });
    });

    describe('gracefully handles errors', () => {
      const errorDetails: ApiErrorDetails = {
        errname: ApiErrorName.Validation,
        error: 400,
        extra: [['something', 'Path must exist when "exists" is set', 0]],
        reason: 'something',
        trace: { class: 'something', formatted: 'something', frames: [] },
        message: null,
      };
      const otherErrorDetails = { ...errorDetails, extra: [['something', 'other message', 0]] };
      const apiErrorToGetTransformed = new ApiCallError({ code: JsonRpcErrorCode.InvalidParams, message: 'something', data: errorDetails });
      const transformedApiError = transformApiCallErrorMessage(
        apiErrorToGetTransformed,
        'Path must exist when "exists" is set',
        'The specified file path does not exist. Please select an existing file or specify a file size to create a new file.',
      );

      const apiErrorWontGetTransformed = new ApiCallError({ code: JsonRpcErrorCode.InvalidParams, message: 'something', data: otherErrorDetails });
      const mockApiCall = (err: ApiCallError, fallback: jest.Mock) => (method: string) => {
        if (method === 'vm.device.create') {
          return throwError(() => err);
        }

        return fallback(method);
      };

      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('properly transforms and displays an error', async () => {
        const spy = spectator.inject(MockApiService);
        spy.call.mockImplementation(mockApiCall(apiErrorToGetTransformed, spy.call));

        await form.fillForm(
          {
            Type: 'Raw File',
            'Raw File': '/mnt/bassein/newfile.raw',
            'Disk Sector Size': 'Default',
            Mode: 'AHCI',
            'Raw Filesize': null,
            'Device Order': '8',
          },
        );

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: null,
            physical_sectorsize: null,
            path: '/mnt/bassein/newfile.raw',
            size: null,
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Raw,
            exists: true,
          },
          order: 8,
          vm: 45,
        }]);

        // we can't actually detect any form changes, but detecting whether or not
        // `handleValidationErrors` was called is sufficient to ensure that the errors
        // *are* actually being handled.
        // see `change-password-form.component.spec.ts`.
        expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
          .toHaveBeenCalledWith(transformedApiError, expect.any(FormGroup));
      });

      it('still handles an error that is not transformed', async () => {
        const spy = spectator.inject(MockApiService);
        spy.call.mockImplementation(mockApiCall(apiErrorWontGetTransformed, spy.call));

        await form.fillForm(
          {
            Type: 'Raw File',
            'Raw File': '/mnt/bassein/newfile.raw',
            'Disk Sector Size': 'Default',
            Mode: 'AHCI',
            'Raw Filesize': null,
            'Device Order': '8',
          },
        );

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            logical_sectorsize: null,
            physical_sectorsize: null,
            path: '/mnt/bassein/newfile.raw',
            size: null,
            type: VmDiskMode.Ahci,
            dtype: VmDeviceType.Raw,
            exists: true,
          },
          order: 8,
          vm: 45,
        }]);

        expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
          .toHaveBeenCalledWith(apiErrorWontGetTransformed, expect.any(FormGroup));
      });

      it('handles errors *not* in the raw file form', async () => {
        const spy = spectator.inject(MockApiService);
        spy.call.mockImplementation(mockApiCall(apiErrorWontGetTransformed, spy.call));

        await form.fillForm({
          Type: 'CD-ROM',
          'CD-ROM Path': '/mnt/cdrom',
          'Device Order': 1002,
        });

        await saveButton.click();

        expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
          .toHaveBeenCalledWith(apiErrorWontGetTransformed, expect.any(FormGroup));
      });
    });
  });

  describe('PCI Passthrough Device', () => {
    const existingPassthrough = {
      id: 4,
      attributes: {
        dtype: VmDeviceType.Pci,
        pptdev: 'pci_0000_00_1c_0',
      },
      order: 5,
      vm: 45,
    } as VmPciPassthroughDevice;

    describe('adds PCI Passthrough Device', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            pptdev: 'pci_0000_00_1c_0',
            dtype: VmDeviceType.Pci,
          },
          order: 6,
          vm: 45,
        }]);
      });
    });

    describe('edits PCI Passthrough Device', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({ virtualMachineId: 45, device: existingPassthrough })),
            }),

          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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

        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [4, {
          attributes: {
            pptdev: 'pci_0000_00_1c_5',
            dtype: VmDeviceType.Pci,
          },
          order: 5,
          vm: 45,
        }]);
      });
    });
  });

  describe('Display', () => {
    const existingSpiceDisplay = {
      id: 1,
      attributes: {
        dtype: VmDeviceType.Display,
        bind: '0.0.0.0',
        password: '12345678910',
        web: true,
        web_port: 5901,
        type: VmDisplayType.Spice,
        resolution: '1024x768',
        port: 5900,
      },
      order: 1002,
      vm: 45,
    } as VmDisplayDevice;

    const existingVncDisplay = {
      id: 2,
      attributes: {
        dtype: VmDeviceType.Display,
        bind: '192.168.1.100',
        password: 'vncpass',
        web: false,
        web_port: null,
        type: VmDisplayType.Vnc,
        resolution: '1920x1080',
        port: 5901,
      },
      order: 1003,
      vm: 45,
    } as VmDisplayDevice;

    describe('edits SPICE display', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({ virtualMachineId: 45, device: existingSpiceDisplay })),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('shows values for an existing Display device', async () => {
        const values = await form.getValues();
        expect(values).toEqual({
          Bind: '0.0.0.0',
          'Device Order': '1002',
          Password: '12345678910',
          'Port (optional)': '5900',
          Resolution: '1024x768',
          'Web Interface': true,
          'Web Port': '5901',
        });
      });

      it('shows web_port field only when Web Interface is enabled', async () => {
        // Initially web is true, so web_port should be visible
        let values = await form.getValues();
        expect(values).toHaveProperty('Web Port', '5901');

        // Disable Web Interface
        await form.fillForm({ 'Web Interface': false });
        spectator.detectChanges();

        // Web Port field should no longer be in the form values
        values = await form.getValues();
        expect(values).not.toHaveProperty('Web Port');

        // Re-enable Web Interface
        await form.fillForm({ 'Web Interface': true });
        spectator.detectChanges();

        // Web Port field should be visible again (though value may be cleared)
        values = await form.getValues();
        expect(values).toHaveProperty('Web Port');
      });
    });

    describe('edits display to 46', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 46 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('hides Display type option when VM already has 2 or more displays (proxy for having 1 display of each type)', async () => {
        spectator.inject(MockApiService).mockCall('vm.get_display_devices', [
          { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Spice } },
          { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Vnc } },
        ] as VmDisplayDevice[]);
        const typeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Type' }));
        expect(api.call).toHaveBeenCalledWith('vm.get_display_devices', [46]);
        expect(await typeSelect.getOptionLabels()).not.toContain('Display');
      });
    });

    describe('edits VNC display', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({ virtualMachineId: 45, device: existingVncDisplay })),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('shows values for an existing VNC display device', async () => {
        const values = await form.getValues();
        expect(values).toMatchObject({
          'Device Order': '1003',
          Password: 'vncpass',
          'Port (optional)': '5901',
        });

        // Verify Web Interface is disabled for VNC
        expect(values).not.toHaveProperty('Web Interface');
        expect(values).not.toHaveProperty('Web Port');
      });

      it('updates an existing VNC display device', async () => {
        await form.fillForm({
          Bind: '0.0.0.0',
          Password: 'newpass',
        });

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [2, {
          attributes: {
            dtype: VmDeviceType.Display,
            type: VmDisplayType.Vnc,
            bind: '0.0.0.0',
            password: 'newpass',
            resolution: '1920x1080',
            port: 5901,
            web: false,
            web_port: null,
          },
          order: 1003,
          vm: 45,
        }]);
      });

      it('validates VNC password length (8 character limit)', async () => {
        await form.fillForm({
          Password: '123456789', // 9 characters - should be invalid for VNC
        });

        expect(spectator.component.displayForm.controls.password.invalid).toBe(true);
        expect(spectator.component.displayForm.controls.password.hasError('maxlength')).toBe(true);
      });
    });

    describe('adds new display devices', () => {
      const createComponentForAdding = createComponentFactory({
        component: DeviceFormComponent,
        imports: [
          ReactiveFormsModule,
        ],
        providers: [
          mockApi([
            mockCall('vm.device.create'),
            mockCall('vm.device.update'),
            mockCall('vm.get_display_devices', []), // No existing display devices
            mockCall('vm.device.bind_choices', {
              '0.0.0.0': '0.0.0.0',
              '::': '::',
            }),
            mockCall('vm.resolution_choices', {
              '640x480': '640x480',
              '800x600': '800x600',
              '1024x768': '1024x768',
              '1920x1080': '1920x1080',
            }),
            mockCall('vm.device.usb_passthrough_choices', {}),
            mockCall('vm.device.passthrough_device_choices', {}),
            mockCall('vm.random_mac', '00:a0:98:30:09:90'),
            mockCall('vm.device.nic_attach_choices', {}),
            mockCall('vm.device.disk_choices', {}),
            mockCall('vm.device.usb_controller_choices', {}),
            mockCall('system.advanced.config', {} as AdvancedConfig),
          ]),
          mockAuth(),
          mockProvider(DialogService),
          mockProvider(SlideIn),
          mockProvider(FilesystemService),
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => ({ virtualMachineId: 45 })),
          }),
          mockProvider(VmService, {
            hasVirtualizationSupport$: of(true),
          }),
        ],
      });

      beforeEach(async () => {
        spectator = createComponentForAdding();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
      });

      it('adds a new SPICE display device', async () => {
        await form.fillForm({
          Type: 'Display',
          'Display Type': 'SPICE',
          Bind: '0.0.0.0',
          Password: 'spicepass',
          Resolution: '1024x768',
          'Web Interface': true,
          'Device Order': 1004,
        });

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            dtype: VmDeviceType.Display,
            type: VmDisplayType.Spice,
            bind: '0.0.0.0',
            password: 'spicepass',
            resolution: '1024x768',
            port: null,
            web: true,
            web_port: null,
          },
          order: 1004,
          vm: 45,
        }]);
      });

      it('adds a new VNC display device', async () => {
        await form.fillForm({
          Type: 'Display',
          'Display Type': 'VNC',
          Bind: '0.0.0.0',
          Password: 'vncpass',
          Resolution: '1920x1080',
          'Device Order': 1005,
        });

        await saveButton.click();

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            dtype: VmDeviceType.Display,
            type: VmDisplayType.Vnc,
            bind: '0.0.0.0',
            password: 'vncpass',
            resolution: '1920x1080',
            port: null,
            web: false,
            web_port: null,
          },
          order: 1005,
          vm: 45,
        }]);
      });
    });

    describe('display type switching', () => {
      const createComponentForSwitching = createComponentFactory({
        component: DeviceFormComponent,
        imports: [
          ReactiveFormsModule,
        ],
        providers: [
          mockApi([
            mockCall('vm.device.create'),
            mockCall('vm.device.update'),
            mockCall('vm.get_display_devices', []), // No existing display devices
            mockCall('vm.device.bind_choices', {
              '0.0.0.0': '0.0.0.0',
              '::': '::',
            }),
            mockCall('vm.resolution_choices', {
              '640x480': '640x480',
              '800x600': '800x600',
              '1024x768': '1024x768',
              '1920x1080': '1920x1080',
            }),
            mockCall('vm.device.usb_passthrough_choices', {}),
            mockCall('vm.device.passthrough_device_choices', {}),
            mockCall('vm.random_mac', '00:a0:98:30:09:90'),
            mockCall('vm.device.nic_attach_choices', {}),
            mockCall('vm.device.disk_choices', {}),
            mockCall('vm.device.usb_controller_choices', {}),
            mockCall('system.advanced.config', {} as AdvancedConfig),
          ]),
          mockAuth(),
          mockProvider(DialogService),
          mockProvider(SlideIn),
          mockProvider(FilesystemService),
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => ({ virtualMachineId: 45 })),
          }),
          mockProvider(VmService, {
            hasVirtualizationSupport$: of(true),
          }),
        ],
      });

      beforeEach(async () => {
        spectator = createComponentForSwitching();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
      });

      it('disables web interface when switching from SPICE to VNC', async () => {
        await form.fillForm({
          Type: 'Display',
          'Display Type': 'SPICE',
          'Web Interface': true,
        });

        // Switch to VNC
        await form.fillForm({ 'Display Type': 'VNC' });
        spectator.detectChanges();

        // Web Interface should be disabled and hidden
        expect(spectator.component.displayForm.controls.web.value).toBe(false);
        expect(spectator.component.displayForm.controls.web.disabled).toBe(true);

        const values = await form.getValues();
        expect(values).not.toHaveProperty('Web Interface');
      });

      it('enables web interface when switching from VNC to SPICE', async () => {
        await form.fillForm({
          Type: 'Display',
          'Display Type': 'VNC',
        });

        // Switch to SPICE
        await form.fillForm({ 'Display Type': 'SPICE' });
        spectator.detectChanges();

        // Web Interface should be enabled and visible
        expect(spectator.component.displayForm.controls.web.enabled).toBe(true);

        const values = await form.getValues();
        expect(values).toHaveProperty('Web Interface');
      });
    });
  });

  describe('USB Passthrough Device', () => {
    const existingUsb = {
      id: 1,
      attributes: {
        dtype: VmDeviceType.Usb,
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
            mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ virtualMachineId: 45 })) }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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

        expect(api.call).toHaveBeenLastCalledWith('vm.device.create', [{
          attributes: {
            controller_type: 'pci-ohci',
            device: 'usb_device_2',
            dtype: VmDeviceType.Usb,
          },
          order: null,
          vm: 45,
        }]);
      });
    });

    describe('edits USB Passthrough Device', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, {
              ...slideInRef,
              getData: jest.fn(() => ({ virtualMachineId: 45, device: existingUsb })),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        api = spectator.inject(ApiService);
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
        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [1, {
          attributes: {
            controller_type: 'piix3-uhci',
            device: 'usb_device_1',
            dtype: VmDeviceType.Usb,
          },
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
        expect(api.call).toHaveBeenLastCalledWith('vm.device.update', [1, {
          attributes: {
            controller_type: 'piix3-uhci',
            device: null,
            usb: {
              vendor_id: 'vendor_1',
              product_id: 'product_1',
            },
            dtype: VmDeviceType.Usb,
          },
          order: 7,
          vm: 45,
        }]);
      });
    });
  });
});
