import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  VmDeviceType, VmDiskMode, VmDisplayType, VmNicType,
} from 'app/enums/vm.enum';
import {
  VmDevice,
  VmDiskDevice,
  VmDisplayDevice,
  VmPassthroughDeviceChoice,
  VmPciPassthroughDevice,
  VmRawFileDevice,
} from 'app/interfaces/vm-device.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import { WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('vm.device.create'),
        mockCall('vm.device.update'),
        mockCall('vm.get_display_devices', []),
        mockCall('vm.device.bind_choices', {
          '0.0.0.0': '0.0.0.0',
          '::': '::',
        }),
        mockCall('vm.resolution_choices', {
          '640x480': '640x480',
          '800x600': '800x600',
          '1024x768': '1024x768',
        }),
        mockCall('vm.device.passthrough_device_choices', {
          pci_0000_00_1c_0: {} as VmPassthroughDeviceChoice,
          pci_0000_00_1c_5: {} as VmPassthroughDeviceChoice,
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
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FilesystemService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    saveButton = await loader.getHarness(MatButtonHarness);
    spectator.component.setVirtualMachineId(45);
    websocket = spectator.inject(WebSocketService);
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
      expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
    });

    it('shows values for an existing CD-ROM device', async () => {
      spectator.component.setDeviceForEdit(existingCdRom);

      const values = await form.getValues();
      expect(values).toEqual({
        'CD-ROM Path': '/mnt/bassein/cdrom',
        'Device Order': '4',
      });
    });

    it('updates an existing CD-ROM device', async () => {
      spectator.component.setDeviceForEdit(existingCdRom);
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

    it('adds a new NIC device', async () => {
      await form.fillForm({
        Type: 'NIC',
      });
      await form.fillForm({
        'Adapter Type': 'VirtIO',
        'NIC To Attach': 'enp0s4',
        'Device Order': 1006,
        'Trust Guest Filters': true,
      });

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

    it('shows values for an existing NIC device', async () => {
      spectator.component.setDeviceForEdit(existingNic);

      const values = await form.getValues();
      expect(values).toEqual({
        'Adapter Type': 'Intel e82585 (e1000)',
        'Device Order': '1002',
        'MAC Address': '00:a0:98:53:a5:ac',
        'NIC To Attach': 'enp0s3',
        'Trust Guest Filters': false,
      });
    });

    it('updates an existing NIC device', async () => {
      spectator.component.setDeviceForEdit(existingNic);

      await form.fillForm({
        'NIC To Attach': 'enp0s3',
      });

      await saveButton.click();

      expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [2, {
        attributes: {
          type: 'E1000',
          mac: '00:a0:98:53:a5:ac',
          nic_attach: 'enp0s3',
          trust_guest_rx_filters: false,
        },
        dtype: VmDeviceType.Nic,
        order: 1002,
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
      spectator.inject(MockWebsocketService).call.mockClear();

      const generateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Generate' }));
      await generateButton.click();

      const values = await form.getValues();
      expect(values).toMatchObject({
        'MAC Address': '00:a0:98:30:09:90',
      });
      expect(websocket.call).toHaveBeenLastCalledWith('vm.random_mac');
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

    it('adds a new disk', async () => {
      await form.fillForm({
        Type: 'Disk',
      });

      await form.fillForm({
        Zvol: 'bassein/zvol1',
        Mode: 'VirtIO',
        'Disk Sector Size': '512',
        'Device Order': '1002',
      });

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

    it('shows values for an existing Disk', async () => {
      spectator.component.setDeviceForEdit(existingDisk);

      const values = await form.getValues();
      expect(values).toEqual({
        Zvol: 'bassein/zvol1',
        'Disk Sector Size': '4096',
        Mode: VmDiskMode.Ahci,
        'Device Order': '1001',
      });
    });

    it('updates an existing Disk', async () => {
      spectator.component.setDeviceForEdit(existingDisk);

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

    it('adds a new Raw File device', async () => {
      await form.fillForm({
        Type: 'Raw File',
      });

      await form.fillForm({
        'Raw File': '/mnt/bassein/newraw',
        'Disk Sector Size': '512',
        Mode: 'AHCI',
        'Raw Filesize': 3,
        'Device Order': '6',
      });
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

    it('shows values for an existing Raw File device', async () => {
      spectator.component.setDeviceForEdit(existingRawFile);
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
      spectator.component.setDeviceForEdit(existingRawFile);

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

    it('adds a new PCI Passthrough device', async () => {
      await form.fillForm({
        Type: 'PCI Passthrough Device',
      });

      await form.fillForm({
        'PCI Passthrough Device': 'pci_0000_00_1c_0',
        'Device Order': '6',
      });
      await saveButton.click();

      expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
        attributes: {
          pptdev: 'pci_0000_00_1c_0',
        },
        dtype: VmDeviceType.Pci,
        order: 6,
        vm: 45,
      }]);
    });

    it('shows values for an existing PCI Passthrough device', async () => {
      spectator.component.setDeviceForEdit(existingPassthrough);
      const values = await form.getValues();
      expect(values).toEqual({
        'PCI Passthrough Device': 'pci_0000_00_1c_0',
        'Device Order': '5',
      });
    });

    it('updates an existing PCI Passthrough device', async () => {
      spectator.component.setDeviceForEdit(existingPassthrough);

      await form.fillForm({
        'PCI Passthrough Device': 'pci_0000_00_1c_5',
      });
      await saveButton.click();

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

  describe('Display', () => {
    const existingDisplay = {
      id: 1,
      dtype: VmDeviceType.Display,
      attributes: {
        bind: '0.0.0.0',
        password: '12345678',
        web: true,
        type: VmDisplayType.Vnc,
        resolution: '1024x768',
        port: 5900,
      },
      order: 1002,
      vm: 45,
    } as VmDisplayDevice;

    it('adds a new Display device', async () => {
      await form.fillForm({
        Type: 'Display',
      });
      await form.fillForm({
        Port: 5950,
        Resolution: '800x600',
        Bind: '::',
      });
      await saveButton.click();

      expect(websocket.call).toHaveBeenLastCalledWith('vm.device.create', [{
        attributes: {
          bind: '::',
          password: '',
          port: 5950,
          resolution: '800x600',
          type: VmDisplayType.Vnc,
          web: true,
        },
        dtype: VmDeviceType.Display,
        order: null,
        vm: 45,
      }]);
    });

    it('shows values for an existing Display device', async () => {
      spectator.component.setDeviceForEdit(existingDisplay);
      const values = await form.getValues();
      expect(values).toEqual({
        Bind: '0.0.0.0',
        'Device Order': '1002',
        'Display Type': VmDisplayType.Vnc,
        Password: '12345678',
        Port: '5900',
        Resolution: '1024x768',
        'Web Interface': true,
      });
    });

    it('updates an existing Display device', async () => {
      spectator.component.setDeviceForEdit(existingDisplay);
      await form.fillForm({
        'Display Type': 'SPICE',
      });

      await saveButton.click();
      expect(websocket.call).toHaveBeenLastCalledWith('vm.device.update', [1, {
        attributes: {
          bind: '0.0.0.0',
          password: '12345678',
          port: 5900,
          resolution: '1024x768',
          type: VmDisplayType.Spice,
          web: true,
        },
        dtype: VmDeviceType.Display,
        order: 1002,
        vm: 45,
      }]);
    });

    it('hides Display type option when VM already has 2 or more displays (proxy for having 1 display of each type)', async () => {
      spectator.inject(MockWebsocketService).mockCall('vm.get_display_devices', [{}, {}] as VmDisplayDevice[]);
      spectator.component.setVirtualMachineId(46);

      const typeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Type' }));
      expect(websocket.call).toHaveBeenCalledWith('vm.get_display_devices', [46]);
      expect(await typeSelect.getOptionLabels()).not.toContain('Display');
    });
  });
});
