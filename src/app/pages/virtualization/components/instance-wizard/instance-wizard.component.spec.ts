import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
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
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InstanceWizardComponent } from 'app/pages/virtualization/components/instance-wizard/instance-wizard.component';
import { VirtualizationImageWithId } from 'app/pages/virtualization/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { ApiService } from 'app/services/websocket/api.service';

// TODO: https://ixsystems.atlassian.net/browse/NAS-133118
describe.skip('InstanceWizardComponent', () => {
  let spectator: SpectatorRouting<InstanceWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createRoutingFactory({
    component: InstanceWizardComponent,
    declarations: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockProvider(AuthService, { hasRole: () => of(true) }),
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
        } as VirtualizationInstance]),
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
        mockJob('virt.instance.create', fakeSuccessfulJob({ id: 'new' } as VirtualizationInstance)),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn((request$: Observable<Job>) => ({
          afterClosed: () => request$.pipe(
            map((job) => job.result),
          ),
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
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('opens SelectImageDialogComponent when Browse image button is pressed and show image label when image is selected', async () => {
    const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
    await browseButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
    expect(await form.getValues()).toMatchObject({
      Image: 'Almalinux 8 Cloud',
    });
  });

  it('creates new instance when form is submitted', async () => {
    await form.fillForm({
      Name: 'new',
      Autostart: true,
      'CPU Configuration': '1-2',
      'Memory Size': '1 GiB',
    });

    const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
    await browseButton.click();

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

    const usbDeviceCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'xHCI Host Controller (0003)' }));
    await usbDeviceCheckbox.setValue(true);

    const useDefaultNetworkCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use default network settings' }));
    await useDefaultNetworkCheckbox.setValue(false);

    const nicDeviceCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'nic1' }));
    await nicDeviceCheckbox.setValue(true);

    const gpuDeviceCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'NVIDIA GeForce GTX 1080' }));
    await gpuDeviceCheckbox.setValue(true);

    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
    await createButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
      name: 'new',
      autostart: true,
      cpu: '1-2',
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
    }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('sends no NIC devices when default network settings checkbox is set', async () => {
    await form.fillForm({
      Name: 'new',
      Autostart: true,
      'CPU Configuration': '1-2',
      'Memory Size': '1 GiB',
    });

    const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
    await browseButton.click();

    const useDefaultNetworkCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use default network settings' }));
    await useDefaultNetworkCheckbox.setValue(false);

    const nicDeviceCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'nic1' }));
    await nicDeviceCheckbox.setValue(true);

    await useDefaultNetworkCheckbox.setValue(true); // no nic1 should be send now

    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
    await createButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.create', [{
      name: 'new',
      autostart: true,
      cpu: '1-2',
      devices: [],
      image: 'almalinux/8/cloud',
      memory: GiB,
      environment: {},
    }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
