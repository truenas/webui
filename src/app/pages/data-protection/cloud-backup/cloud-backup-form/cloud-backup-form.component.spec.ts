import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  CloudCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { googlePhotosCreds, googlePhotosProvider, storjProvider } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudBackupFormComponent', () => {
  const storjCreds = {
    id: 2,
    name: 'Storj iX',
    provider: CloudSyncProviderName.Storj,
    attributes: {
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      token: 'test-token',
    },
  };

  const existingTask = {
    id: 1,
    description: 'sdf',
    path: '/mnt/my pool',
    attributes: {
      folder: '/My Folder',
      chunk_size: 48,
    },
    pre_script: '',
    post_script: '',
    snapshot: false,
    bwlimit: [],
    include: [],
    exclude: [],
    transfers: 5,
    args: '',
    enabled: true,
    job: null,
    password: '1234',
    keep_last: 2,
    credentials: storjCreds,
    schedule: {
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: 'sun',
    },
    locked: false,
  } as CloudBackup;

  let loader: HarnessLoader;
  let spectator: Spectator<CloudBackupFormComponent>;
  const getData = jest.fn(() => existingTask);
  const chainedComponentRef: ChainedRef<CloudBackup> = {
    close: jest.fn(),
    getData: jest.fn(() => undefined),
    swap: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: CloudBackupFormComponent,
    imports: [
      CloudCredentialsSelectComponent,
      ReactiveFormsModule,
      TransferModeExplanationComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockWebSocket([
        mockCall('cloud_backup.create', existingTask),
        mockCall('cloud_backup.update', existingTask),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(CloudCredentialService, {
        getCloudSyncCredentials: jest.fn(() => of([googlePhotosCreds, storjCreds])),
        getProviders: jest.fn(() => of([storjProvider, googlePhotosProvider])),
        getBuckets: jest.fn(() => of([{ Name: 'bucket1', Path: 'path_to_bucket1', Enabled: true }])),
      }),
      mockProvider(FilesystemService),
      mockProvider(ChainedRef, chainedComponentRef),
    ],
  });

  describe('adds a new cloud backup', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds a new cloud backup task and creates a new bucket', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Source Path': '/mnt/my pool 2',
        Name: 'Cloud Backup Task With New Bucket',
        Password: 'qwerty',
        Credentials: 'Storj iX (Storj)',
        'Keep Last': 5,
        Folder: '/',
        Bucket: 'Add new',
        'New Bucket Name': 'brand-new-bucket',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloud_backup.create', [{
        args: '',
        attributes: { folder: '/', bucket: 'brand-new-bucket' },
        bwlimit: [],
        credentials: 2,
        description: 'Cloud Backup Task With New Bucket',
        enabled: true,
        exclude: [],
        include: [],
        keep_last: 5,
        password: 'qwerty',
        path: '/mnt/my pool 2',
        post_script: '',
        pre_script: '',
        schedule: {
          dom: '*',
          dow: '*',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: false,
        transfers: null,
      }]);
      expect(chainedComponentRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });

    it('adds a new cloud backup task when new form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Source Path': '/mnt/my pool 2',
        Name: 'New Cloud Backup Task',
        Password: 'qwerty',
        Credentials: 'Storj iX (Storj)',
        'Keep Last': 3,
        Folder: '/',
        Enabled: false,
        Transfers: 22,
        Bucket: 'bucket1',
        'Take Snapshot': true,
        Exclude: ['/test'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('cloud_backup.create', [{
        args: '',
        attributes: { folder: '/', bucket: 'path_to_bucket1' },
        bwlimit: [],
        credentials: 2,
        description: 'New Cloud Backup Task',
        enabled: false,
        exclude: ['/test'],
        include: [],
        keep_last: 3,
        password: 'qwerty',
        path: '/mnt/my pool 2',
        post_script: '',
        pre_script: '',
        schedule: {
          dom: '*',
          dow: '*',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: true,
        transfers: 22,
      }]);
      expect(chainedComponentRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });

  describe('edits an existing cloud backup', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(ChainedRef, {
            ...chainedComponentRef,
            getData,
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing cloud backup task when it is open for edit', async () => {
      const form = await loader.getHarness(IxFormHarness);
      expect(await form.getValues()).toEqual({
        'Bandwidth Limit': [],
        Bucket: '',
        Credentials: 'Storj iX (Storj)',
        Enabled: true,
        Exclude: [],
        Name: 'sdf',
        Folder: '/My Folder',
        'Keep Last': '2',
        Password: '1234',
        'Post-script': '',
        'Pre-script': '',
        Schedule: 'Weekly (0 0 * * sun)  On Sundays at 00:00 (12:00 AM)',
        'Source Path': '/mnt/my pool',
        'Take Snapshot': false,
        Transfers: '5',
      });

      expect(spectator.component.form.value).toEqual({
        args: '',
        bucket: '',
        bwlimit: [],
        credentials: 2,
        description: 'sdf',
        enabled: true,
        exclude: [],
        folder: '/My Folder',
        keep_last: 2,
        password: '1234',
        path: '/mnt/my pool',
        post_script: '',
        pre_script: '',
        schedule: '0 0 * * sun',
        snapshot: false,
        transfers: 5,
      });
    });

    it('saves updated cloud backup task when form opened for edit is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'Edited description',
        Password: 'qwerty123',
        Bucket: 'bucket1',
        'Source Path': '/mnt/path1',
        'Bandwidth Limit': ['00:00,10G', '12:00,20M', '18:00,10K', '20:00,off'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('cloud_backup.update', [1, {
        args: '',
        attributes: {
          folder: '/My Folder',
          bucket: 'path_to_bucket1',
        },
        bwlimit: [
          {
            bandwidth: '10737418240',
            time: '00:00',
          },
          {
            bandwidth: '20971520',
            time: '12:00',
          },
          {
            bandwidth: '10240',
            time: '18:00',
          },
          {
            bandwidth: null,
            time: '20:00',
          },
        ],
        credentials: 2,
        description: 'Edited description',
        enabled: true,
        exclude: [],
        include: [],
        keep_last: 2,
        password: 'qwerty123',
        path: '/mnt/path1',
        post_script: '',
        pre_script: '',
        schedule: {
          dom: '*',
          dow: 'sun',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: false,
        transfers: 5,
      }]);
      expect(chainedComponentRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });
});
