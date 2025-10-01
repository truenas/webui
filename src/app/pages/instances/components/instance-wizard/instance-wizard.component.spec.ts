import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { map, Observable, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Job } from 'app/interfaces/job.interface';
import { VirtualizationGlobalConfig } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceWizardComponent } from 'app/pages/instances/components/instance-wizard/instance-wizard.component';
import {
  VirtualizationImageWithId,
} from 'app/pages/instances/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

describe('InstanceWizardComponent', () => {
  let spectator: SpectatorRouting<InstanceWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const globalConfig = {
    storage_pools: ['poolio'],
    bridge: 'br0',
    v4_network: 'v4_network',
    v6_network: 'v6_network',
  } as VirtualizationGlobalConfig;

  const createComponent = createRoutingFactory({
    component: InstanceWizardComponent,
    declarations: [
      MockComponent(PageHeaderComponent),
      MockComponent(ExplorerCreateDatasetComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(UploadService, {
        uploadAsJob: jest.fn(() => of(fakeSuccessfulJob())),
      }),
      mockProvider(Router),
      mockProvider(FilesystemService),
      mockApi([
        mockCall('container.query', [
          fakeVirtualizationInstance({ name: 'test' }),
          fakeVirtualizationInstance({ name: 'testVM' }),
        ]),
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
        mockJob('container.create', fakeSuccessfulJob(fakeVirtualizationInstance({ id: 999 }))),
        mockCall('virt.global.pool_choices', {
          poolio: 'poolio',
        }),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn((request$: Observable<Job>) => ({
          afterClosed: () => request$.pipe(map((job) => ({ ...job }))),
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
        state$: of({ isLoading: false, config: globalConfig }),
        initialize: jest.fn(),
        config: jest.fn(() => globalConfig),
      }),
    ],
  });

  beforeEach(async () => {
    // Mock crypto.randomUUID for Jest environment
    Object.defineProperty(global, 'crypto', {
      value: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        randomUUID: () => 'test-uuid-12345',
      },
    });

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
    it('creates new instance with basic fields when form is submitted', async () => {
      await form.fillForm({
        Name: 'new',
        'CPU Set': '1-2',
        'Memory Size (MB)': 1024,
      });

      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
      await browseButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
      expect(await form.getValues()).toMatchObject({
        Image: 'almalinux/8/cloud',
      });

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('container.create', [
        expect.objectContaining({
          uuid: 'test-uuid-12345',
          name: 'new',
          pool: 'poolio',
          image: { name: 'almalinux/8/cloud', version: '' },
          autostart: true,
          cpuset: '1-2',
          memory: 1024,
          init: '/sbin/init',
          time: 'LOCAL',
          shutdown_timeout: 30,
          capabilities_policy: 'DEFAULT',
        }),
      ]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
