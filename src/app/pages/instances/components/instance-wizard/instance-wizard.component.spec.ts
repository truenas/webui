import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  DiskIoBus,
  VirtualizationDeviceType,
  VirtualizationGpuType,
  VirtualizationNicType,
  VirtualizationProxyProtocol,
  VirtualizationSource,
  VirtualizationType,
  VolumeContentType,
} from 'app/enums/virtualization.enum';
import { Job } from 'app/interfaces/job.interface';
import { VirtualizationInstance, VirtualizationVolume } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxIconGroupHarness } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  PciPassthroughDialogComponent,
} from 'app/pages/instances/components/common/pci-passthough-dialog/pci-passthrough-dialog.component';
import { VolumesDialogComponent } from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
import { InstanceWizardComponent } from 'app/pages/instances/components/instance-wizard/instance-wizard.component';
import {
  VirtualizationImageWithId,
} from 'app/pages/instances/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
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
            secureboot: true,
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
    it('shows error for invalid name, it could only contain alphanumeric and hyphen characters', async () => {
      const instanceNameControl = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));

      await form.fillForm({
        Name: 'invalid_name',
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
        iso_volume: null,
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
          { dev_type: VirtualizationDeviceType.Gpu, pci: 'pci_0000_01_00_0', gpu_type: VirtualizationGpuType.Physical },
        ],
        image: 'almalinux/8/cloud',
        memory: GiB,
        source_type: VirtualizationSource.Image,
        environment: {},
        enable_vnc: false,
        vnc_port: null,
        volume: null,
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
        source_type: VirtualizationSource.Image,
        enable_vnc: false,
        vnc_port: null,
        iso_volume: null,
        instance_type: VirtualizationType.Container,
        environment: {},
        volume: null,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('vm', () => {
    it('creates new instance with catalog iso when form is submitted', async () => {
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

      jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
        afterClosed: () => of({
          id: 'my-volume',
        } as VirtualizationVolume),
      } as MatDialogRef<VolumesDialogComponent>);

      const selectVolumeButton = await diskForm.getHarness(MatButtonHarness.with({ text: 'Select Volume' }));
      await selectVolumeButton.click();

      await diskForm.fillForm({
        'Boot Priority': 2,
        'I/O Bus': 'NVMe',
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

      const matDialog = spectator.inject(MatDialog);
      jest.spyOn(matDialog, 'open').mockReturnValue({
        afterClosed: () => of([{
          label: '0000:08:02.0 SCSI storage controller',
          value: '0000:08:02.0',
        }]),
      } as MatDialogRef<PciPassthroughDialogComponent>);

      const addPciButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add PCI Passthrough' }));
      await addPciButton.click();

      await form.fillForm({
        'Enable VNC': true,
        'VNC Port': 9000,
        'VNC Password': 'testing',
        'Secure Boot': true,
      });

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '1-2',
        root_disk_io_bus: DiskIoBus.Nvme,
        instance_type: VirtualizationType.Vm,
        iso_volume: null,
        devices: [
          {
            dev_type: VirtualizationDeviceType.Disk,
            source: 'my-volume',
            boot_priority: 2,
            io_bus: DiskIoBus.Nvme,
          },
          { dev_type: VirtualizationDeviceType.Nic, nic_type: VirtualizationNicType.Bridged, parent: 'nic1' },
          { dev_type: VirtualizationDeviceType.Usb, product_id: '0003' },
          { dev_type: VirtualizationDeviceType.Gpu, pci: 'pci_0000_01_00_0', gpu_type: VirtualizationGpuType.Physical },
          {
            dev_type: VirtualizationDeviceType.Pci,
            address: '0000:08:02.0',
          },
        ],
        image: 'almalinux/8/cloud',
        memory: GiB,
        enable_vnc: true,
        vnc_port: 9000,
        source_type: VirtualizationSource.Image,
        root_disk_size: 9,
        vnc_password: 'testing',
        secure_boot: true,
        volume: null,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('creates new instance with an ISO when form is submitted', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
        afterClosed: () => of({
          id: 'myiso.iso',
          content_type: VolumeContentType.Iso,
        } as VirtualizationVolume),
      } as MatDialogRef<VolumesDialogComponent>);

      const instanceType = await loader.getHarness(IxIconGroupHarness.with({ label: 'Virtualization Method' }));
      await instanceType.setValue('VM');

      await form.fillForm({
        Name: 'new',
        'VM Image Options': 'Upload ISO, import a zvol or use another volume',
        'CPU Configuration': '2',
        'Memory Size': '1 GiB',
        'Root Disk I/O Bus': 'Virtio-BLK',
      });

      const selectIso = await loader.getHarness(MatButtonHarness.with({ text: 'Select Volume' }));
      await selectIso.click();

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '2',
        root_disk_io_bus: DiskIoBus.VirtioBlk,
        instance_type: VirtualizationType.Vm,
        devices: [],
        image: null,
        iso_volume: 'myiso.iso',
        source_type: VirtualizationSource.Iso,
        enable_vnc: false,
        memory: 1073741824,
        secure_boot: false,
        vnc_port: null,
        root_disk_size: 10,
        volume: null,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('creates new instance with a root volume when form is submitted', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
        afterClosed: () => of({
          id: 'myvolume',
          content_type: VolumeContentType.Block,
        } as VirtualizationVolume),
      } as MatDialogRef<VolumesDialogComponent>);

      const instanceType = await loader.getHarness(IxIconGroupHarness.with({ label: 'Virtualization Method' }));
      await instanceType.setValue('VM');

      await form.fillForm({
        Name: 'new',
        'VM Image Options': 'Upload ISO, import a zvol or use another volume',
        'CPU Configuration': '2',
        'Memory Size': '1 GiB',
      });

      const selectIso = await loader.getHarness(MatButtonHarness.with({ text: 'Select Volume' }));
      await selectIso.click();

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '2',
        root_disk_io_bus: DiskIoBus.Nvme,
        instance_type: VirtualizationType.Vm,
        devices: [],
        image: null,
        iso_volume: null,
        source_type: VirtualizationSource.Volume,
        enable_vnc: false,
        secure_boot: false,
        memory: 1073741824,
        vnc_port: null,
        root_disk_size: 10,
        volume: 'myvolume',
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('does not show Proxies section when instance type is VM', async () => {
      const instanceType = await loader.getHarness(IxIconGroupHarness.with({ label: 'Virtualization Method' }));
      await instanceType.setValue('VM');

      const proxiesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Proxies' }));
      expect(proxiesList).toBeNull();
    });
  });

  describe('container | vm switching', () => {
    it('should reset image field and clear disks when "Virtualization Method" changes', async () => {
      const diskList = await loader.getHarness(IxListHarness.with({ label: 'Disks' }));
      await diskList.pressAddButton();
      const diskForm = await diskList.getLastListItem();

      await form.fillForm({ Image: 'container-latest' });
      await diskForm.fillForm({ Source: '/mnt/container-disk' });

      expect(await form.getValues()).toMatchObject({ Image: 'container-latest' });
      expect((await diskList.getListItems())).toHaveLength(1);

      const instanceTypeControl = await loader.getHarness(IxIconGroupHarness.with({ label: 'Virtualization Method' }));
      await instanceTypeControl.setValue('VM');

      expect(await form.getValues()).toMatchObject({ Image: '' });
      expect((await diskList.getListItems())).toHaveLength(0);

      await diskList.pressAddButton();
      await diskForm.fillForm({ Source: '/mnt/vm-disk' });
      await form.fillForm({ Image: 'vm-latest' });

      expect(await form.getValues()).toMatchObject({ Image: 'vm-latest' });
      expect((await diskList.getListItems())).toHaveLength(1);

      await instanceTypeControl.setValue('CONTAINER');
    });
  });
});
