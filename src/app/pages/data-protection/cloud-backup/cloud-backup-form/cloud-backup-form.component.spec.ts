import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { CloudCredentialsSelectModule } from 'app/modules/custom-selects/cloud-credentials-select/cloud-credentials-select.module';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { googlePhotosCreds, googlePhotosProvider, storjProvider } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudBackupFormComponent', () => {
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
    transfers: null,
    args: '',
    enabled: true,
    job: null,
    password: '1234',
    keep_last: 2,
    credentials: {
      id: 3,
      name: 'Dropbox',
      provider: 'DROPBOX',
      attributes: {
        client_id: '6cnx5tsf9ll6wib',
        client_secret: '3ypjw57mtarox7y',
        token: '{"access_token": "test_token", "token_type": "bearer", "refresh_token": "test_refresh_token", "expiry": "2024-02-12T22:39:53Z"}',
      },
    },
    schedule: {
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: '0',
    },
    locked: false,
  } as unknown as CloudBackup;

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
      IxFormsModule,
      SchedulerModule,
      CloudCredentialsSelectModule,
      ReactiveFormsModule,
    ],
    declarations: [
      TransferModeExplanationComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockWebSocket([
        mockCall('cloud_backup.create', existingTask),
        mockCall('cloud_backup.update', existingTask),
        mockCall('cloudsync.providers', [storjProvider, googlePhotosProvider]),
        mockCall('cloudsync.credentials.query', [googlePhotosCreds]),
      ]),
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(CloudCredentialService, {
        getCloudSyncCredentials: jest.fn(() => of([googlePhotosCreds])),
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

    it('adds a new cloud backup task when new form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'New Cloud Backup Task',
        Password: 'qwerty',
        Credentials: 'Google Photos (Google Photos)',
        'Keep Last': 3,
        Folder: '/',
        Bucket: 'bucket1',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('cloud_backup.create', [{
        args: '',
        attributes: { folder: '/' },
        credentials: 1,
        description: 'New Cloud Backup Task',
        enabled: true,
        exclude: [],
        include: [],
        keep_last: 3,
        password: 'qwerty',
        path: '/mnt',
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
        Credentials: '',
        Description: 'sdf',
        Folder: '/My Folder',
        'Keep Last': '2',
        Password: '1234',
        Schedule: 'Weekly (0 0 * * 0)  On Sundays at 00:00 (12:00 AM)',
        'Source Path': '/mnt/my pool',
      });

      expect(spectator.component.form.value).toEqual({
        args: '',
        bucket: '',
        credentials: 3,
        description: 'sdf',
        enabled: true,
        exclude: [],
        folder: '/My Folder',
        keep_last: 2,
        password: '1234',
        path: [
          '/mnt/my pool',
        ],
        post_script: '',
        pre_script: '',
        schedule: '0 0 * * 0',
        snapshot: false,
        transfers: null,
      });
    });

    it('saves updated cloud backup task when form opened for edit is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'Edited description',
        Password: 'qwerty123',
        Bucket: 'bucket1',
        'Source Path': ['/mnt/path1', '/mnt/path2'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('cloud_backup.update', [1, {
        args: '',
        attributes: {
          folder: '/My Folder',
        },
        bwlimit: undefined,
        credentials: 3,
        description: 'Edited description',
        enabled: true,
        exclude: [],
        include: ['/path1/**', '/path2/**'],
        keep_last: 2,
        password: 'qwerty123',
        path: '/mnt',
        post_script: '',
        pre_script: '',
        schedule: {
          dom: '*',
          dow: '0',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: false,
        transfers: null,
      }]);
      expect(chainedComponentRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });
});
