import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudsyncTransferSetting } from 'app/enums/cloudsync-transfer-setting.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  CloudCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import {
  googlePhotosCreds,
  googlePhotosProvider,
  storjProvider,
} from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('CloudBackupFormComponent', () => {
  const storjCreds = {
    id: 2,
    name: 'Storj iX',
    provider: {
      type: CloudSyncProviderName.Storj,
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
    absolute_paths: true,
    include: [],
    exclude: [],
    transfer_setting: CloudsyncTransferSetting.Performance,
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
    requireConfirmationWhen: jest.fn(),
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
      mockApi([
        mockCall('cloud_backup.create', existingTask),
        mockCall('cloud_backup.update', existingTask),
        mockCall('cloudsync.create_bucket'),
        mockCall('cloud_backup.transfer_setting_choices', [
          CloudsyncTransferSetting.Default,
          CloudsyncTransferSetting.Performance,
          CloudsyncTransferSetting.FastStorage,
        ]),
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

    it('disables absolute paths when snapshot is enabled and resets to false', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Use Absolute Paths': true,
      });

      await form.fillForm({
        'Take Snapshot': true,
      });

      const useAbsolutePathsControl = await form.getControl('Use Absolute Paths');

      expect(await useAbsolutePathsControl.isDisabled()).toBe(true);
      expect(await useAbsolutePathsControl.getValue()).toBe(false);
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

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloud_backup.create', [{
        args: '',
        attributes: { folder: '/', bucket: 'brand-new-bucket' },
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
        absolute_paths: false,
        transfer_setting: CloudsyncTransferSetting.Default,
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
        Bucket: 'bucket1',
        'Take Snapshot': false,
        'Use Absolute Paths': true,
        Exclude: ['/test'],
        'Transfer Setting': 'Fast Storage',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('cloud_backup.create', [{
        args: '',
        attributes: { folder: '/', bucket: 'path_to_bucket1' },
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
        snapshot: false,
        absolute_paths: true,
        transfer_setting: CloudsyncTransferSetting.FastStorage,
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
        'Use Absolute Paths': true,
        'Transfer Setting': 'Performance',
      });
    });

    it('saves updated cloud backup task when form opened for edit is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'Edited description',
        Password: 'qwerty123',
        Bucket: 'bucket1',
        'Source Path': '/mnt/path1',
      });

      const useAbsolutePathsControl = await form.getControl('Use Absolute Paths');

      expect(await useAbsolutePathsControl.isDisabled()).toBe(true);
      expect(await useAbsolutePathsControl.getValue()).toBe(true);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('cloud_backup.update', [1, {
        args: '',
        attributes: {
          folder: '/My Folder',
          bucket: 'path_to_bucket1',
        },
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
        transfer_setting: CloudsyncTransferSetting.Performance,
      }]);
      expect(chainedComponentRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });
});
