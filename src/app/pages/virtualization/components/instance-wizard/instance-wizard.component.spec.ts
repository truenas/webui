import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  VirtualizationDeviceType,
  VirtualizationNicType,
  VirtualizationProxyProtocol,
  VirtualizationType,
} from 'app/enums/virtualization.enum';
import { Job } from 'app/interfaces/job.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxIconGroupHarness } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceWizardComponent } from 'app/pages/virtualization/components/instance-wizard/instance-wizard.component';
import { VirtualizationImageWithId } from 'app/pages/virtualization/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

describe('InstanceWizardComponent', () => {
  let spectator: SpectatorRouting<InstanceWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createRoutingFactory({
    component: InstanceWizardComponent,
    declarations: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(UploadService, {
        uploadAsJob: jest.fn(() => of(fakeSuccessfulJob())),
      }),
      mockProvider(Router),
      mockProvider(FilesystemService),
      mockApi([
        mockCall('virt.instance.query', [{
          id: 'test',
          name: 'test',
          type: VirtualizationType.Container,
          autostart: false,
          cpu: 'Intel Xeon',
          memory: 2 * GiB,
        },
        {
          id: 'testVM',
          name: 'testVM',
          type: VirtualizationType.Vm,
          autostart: false,
          cpu: 'Intel Xeon',
          memory: 4 * GiB,
        }] as VirtualizationInstance[]),
        mockCall('interface.has_pending_changes', false),
        mockCall('virt.device.nic_choices', {
          nic1: 'nic1',
        }),
        mockCall('virt.device.gpu_choices', {
          pci_0000_01_00_0: {
            bus: 1,
            slot: 1,
            description: 'NVIDIA GeForce GTX 1080',
            vendor: 'NVIDIA Corporation',
          },
        }),
        mockCall('virt.device.usb_choices', {
          xhci: {
            vendor_id: '1d6b',
            product_id: '0003',
            bus: 2,
            dev: 1,
            product: 'xHCI Host Controller',
            manufacturer: 'Linux 6.6.44-production+truenas xhci-hcd',
          },
        }),
        mockJob('virt.volume.import_iso', fakeSuccessfulJob({ name: 'image.iso' })),
        mockJob('virt.instance.create', fakeSuccessfulJob({ id: 'new' } as VirtualizationInstance)),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn((request$: Observable<Job>) => ({
          afterClosed: () => request$,
        })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({
            id: 'almalinux/8/cloud',
            label: 'Almalinux 8 Cloud',
          } as VirtualizationImageWithId),
        })),
      }),
      mockProvider(VirtualizationConfigStore, {
        initialize: jest.fn(),
        config: jest.fn(() => ({ v4_network: 'v4_network', v6_network: 'v6_network' })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('name validation', () => {
    it('shows error for invalid name', async () => {
      const instanceNameControl = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));

      await form.fillForm({
        Name: 'invalid+_@name',
      });

      expect(await instanceNameControl.getErrorText()).toBe('Invalid format or character');
    });

    it('shows error for already existing name', async () => {
      const instanceNameControl = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));

      await form.fillForm({
        Name: 'test',
      });

      expect(await instanceNameControl.getErrorText()).toBe('The name "test" is already in use.');
    });
  });

  describe('container', () => {
    it('creates new instance when form is submitted', async () => {
      await form.fillForm({
        Name: 'new',
        'CPU Configuration': '1-2',
        'Memory Size': '1 GiB',
      });

      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
      await browseButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
      expect(await form.getValues()).toMatchObject({
        Image: 'almalinux/8/cloud',
      });

      const diskList = await loader.getHarness(IxListHarness.with({ label: 'Disks' }));
      await diskList.pressAddButton();
      const diskForm = await diskList.getLastListItem();
      await diskForm.fillForm({
        Source: '/mnt/source',
        Destination: 'destination',
      });

      const proxiesList = await loader.getHarness(IxListHarness.with({ label: 'Proxies' }));
      await proxiesList.pressAddButton();
      const proxyForm = await proxiesList.getLastListItem();
      await proxyForm.fillForm({
        'Host Port': 3000,
        'Host Protocol': 'TCP',
        'Instance Port': 2000,
        'Instance Protocol': 'UDP',
      });

      // TODO: Fix this to use IxCheckboxHarness
      const usbDeviceCheckbox = await loader.getHarness(MatCheckboxHarness.with({
        label: 'xHCI Host Controller (0003)',
      }));
      await usbDeviceCheckbox.check();

      const listItems = spectator.queryAll('.network-list-item > span');
      expect(listItems.map((element) => element.textContent)).toEqual([
        'Automatic',
        'v4_network',
        'v6_network',
      ]);

      const useDefaultNetworkCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use default network settings' }));
      await useDefaultNetworkCheckbox.setValue(false);

      // TODO: Fix this to use IxCheckboxHarness
      const nicDeviceCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'nic1' }));
      await nicDeviceCheckbox.check();

      // TODO: Fix this to use IxCheckboxHarness
      const gpuDeviceCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'NVIDIA GeForce GTX 1080' }));
      await gpuDeviceCheckbox.check();

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '1-2',
        instance_type: VirtualizationType.Container,
        devices: [
          {
            dev_type: VirtualizationDeviceType.Disk,
            source: '/mnt/source',
            destination: 'destination',
          },
          {
            dev_type: VirtualizationDeviceType.Proxy,
            source_port: 3000,
            source_proto: VirtualizationProxyProtocol.Tcp,
            dest_port: 2000,
            dest_proto: VirtualizationProxyProtocol.Udp,
          },
          { dev_type: VirtualizationDeviceType.Nic, nic_type: VirtualizationNicType.Bridged, parent: 'nic1' },
          { dev_type: VirtualizationDeviceType.Usb, product_id: '0003' },
          { dev_type: VirtualizationDeviceType.Gpu, pci: 'pci_0000_01_00_0' },
        ],
        image: 'almalinux/8/cloud',
        memory: GiB,
        environment: {},
        enable_vnc: false,
        vnc_port: null,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('sends no NIC devices when default network settings checkbox is set', async () => {
      await form.fillForm({
        Name: 'new',
        'CPU Configuration': '1-2',
        'Memory Size': '1 GiB',
      });

      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
      await browseButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
      expect(await form.getValues()).toMatchObject({
        Image: 'almalinux/8/cloud',
      });

      const useDefaultNetworkCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use default network settings' }));
      await useDefaultNetworkCheckbox.setValue(false);

      // TODO: Fix this to use IxCheckboxHarness
      const nicDeviceCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'nic1' }));
      await nicDeviceCheckbox.check();

      await useDefaultNetworkCheckbox.setValue(true); // no nic1 should be send now
      spectator.detectChanges();

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '1-2',
        devices: [],
        image: 'almalinux/8/cloud',
        memory: GiB,
        enable_vnc: false,
        vnc_port: null,
        instance_type: 'CONTAINER',
        environment: {},
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('vm', () => {
    it('creates new instance when form is submitted', async () => {
      await form.fillForm({
        Name: 'new',
        'CPU Configuration': '1-2',
        'Memory Size': '1 GiB',
      });

      const instanceType = await loader.getHarness(IxIconGroupHarness.with({ label: 'Virtualization Method' }));
      await instanceType.setValue('VM');

      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
      await browseButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
      expect(await form.getValues()).toMatchObject({
        Image: 'almalinux/8/cloud',
      });

      await form.fillForm({
        'Root Disk Size (in GiB)': 9,
      });

      const diskList = await loader.getHarness(IxListHarness.with({ label: 'Disks' }));
      await diskList.pressAddButton();
      const diskForm = await diskList.getLastListItem();
      await diskForm.fillForm({
        Source: '/mnt/source',
      });

      const proxiesList = await loader.getHarness(IxListHarness.with({ label: 'Proxies' }));
      await proxiesList.pressAddButton();
      const proxyForm = await proxiesList.getLastListItem();
      await proxyForm.fillForm({
        'Host Port': 3000,
        'Host Protocol': 'TCP',
        'Instance Port': 2000,
        'Instance Protocol': 'UDP',
      });

      // TODO: Fix this to use IxCheckboxHarness
      const usbDeviceCheckbox = await loader.getHarness(MatCheckboxHarness.with({
        label: 'xHCI Host Controller (0003)',
      }));
      await usbDeviceCheckbox.check();

      const useDefaultNetworkCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use default network settings' }));
      await useDefaultNetworkCheckbox.setValue(false);

      // TODO: Fix this to use IxCheckboxHarness
      const nicDeviceCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'nic1' }));
      await nicDeviceCheckbox.check();

      // TODO: Fix this to use IxCheckboxHarness
      const gpuDeviceCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'NVIDIA GeForce GTX 1080' }));
      await gpuDeviceCheckbox.check();

      await form.fillForm({
        'Enable VNC': true,
        'VNC Port': 9000,
        'VNC Password': 'testing',
        'Secure Boot': true,
      });

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '1-2',
        instance_type: VirtualizationType.Vm,
        devices: [
          {
            dev_type: VirtualizationDeviceType.Disk,
            source: '/mnt/source',
          },
          {
            dev_type: VirtualizationDeviceType.Proxy,
            source_port: 3000,
            source_proto: VirtualizationProxyProtocol.Tcp,
            dest_port: 2000,
            dest_proto: VirtualizationProxyProtocol.Udp,
          },
          { dev_type: VirtualizationDeviceType.Nic, nic_type: VirtualizationNicType.Bridged, parent: 'nic1' },
          { dev_type: VirtualizationDeviceType.Usb, product_id: '0003' },
          { dev_type: VirtualizationDeviceType.Gpu, pci: 'pci_0000_01_00_0' },
        ],
        image: 'almalinux/8/cloud',
        memory: GiB,
        enable_vnc: true,
        vnc_port: 9000,
        root_disk_size: 9,
        vnc_password: 'testing',
        secure_boot: true,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('loads image and creates new instance when form is submitted', async () => {
      global.Date.now = jest.fn(() => (new Date('2025-01-20 12:00:00')).getTime());

      const instanceType = await loader.getHarness(IxIconGroupHarness.with({ label: 'Virtualization Method' }));
      await instanceType.setValue('VM');

      await form.fillForm({
        Name: 'new',
        'VM Image Options': 'Upload an ISO image',
        'CPU Configuration': '2',
        'Memory Size': '1 GiB',
      });

      const fakeImage = fakeFile('image.iso');
      await form.fillForm({ Image: [fakeImage] });

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(UploadService).uploadAsJob).toHaveBeenCalledWith({
        file: fakeImage,
        method: 'virt.volume.import_iso',
        params: [{
          name: 'image_1737367200000.iso',
          upload_iso: true,
        }],
      });

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '2',
        instance_type: VirtualizationType.Vm,
        devices: [{
          dev_type: VirtualizationDeviceType.Disk,
          source: 'image_1737367200000.iso',
          destination: null,
          boot_priority: 1,
        }],
        enable_vnc: false,
        source_type: null,
        memory: 1073741824,
        secure_boot: false,
        vnc_port: null,
        root_disk_size: 10,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
