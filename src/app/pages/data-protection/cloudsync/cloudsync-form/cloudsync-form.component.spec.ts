import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  CloudCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';

describe('CloudSyncFormComponent', () => {
  const existingTask = {
    id: 1,
    description: 'New Cloud Sync Task',
    direction: Direction.Push,
    path: '/mnt/my pool',
    attributes: { folder: '/test/' } as Record<string, string>,
    enabled: false,
    transfer_mode: TransferMode.Copy,
    encryption: true,
    filename_encryption: true,
    encryption_password: 'password',
    encryption_salt: 'salt',
    args: '',
    post_script: 'test post-script',
    pre_script: 'test pre-script',
    snapshot: false,
    bwlimit: [
      { time: '13:00', bandwidth: 1024 },
      { time: '15:00' },
    ],
    include: [],
    exclude: [],
    transfers: 2,
    create_empty_src_dirs: true,
    follow_symlinks: true,
    credentials: {
      id: 2,
      name: 'test2',
      provider: {
        type: CloudSyncProviderName.Mega,
        user: 'login',
        pass: 'password',
      },
    } as CloudSyncCredential,
    schedule: {
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: '0',
    },
    locked: false,
    job: null,
    credential: 'test2',
    next_run_time: 'Disabled',
    next_run: 'Disabled',
    state: { state: JobState.Pending },
  } as CloudSyncTaskUi;

  const existingTask2 = {
    id: 1,
    description: 'test3',
    path: '/mnt/dozer',
    attributes: {
      folder: '/',
      bucket: 'test3',
      fast_list: false,
    },
    next_run: 'Disabled',
    pre_script: '',
    post_script: '',
    snapshot: false,
    include: [],
    exclude: [],
    args: '',
    enabled: true,
    job: null,
    direction: 'PULL',
    transfer_mode: 'COPY',
    bwlimit: [],
    transfers: 4,
    encryption: false,
    filename_encryption: false,
    encryption_password: '',
    encryption_salt: '',
    create_empty_src_dirs: false,
    follow_symlinks: false,
    credentials: {
      id: 1,
      name: 'Storj',
      provider: {
        type: 'STORJ_IX',
        access_key_id: 'julzdrlwyv37oixflnbyysbumg3q',
        secret_access_key: 'jyncyw7oup4ad2fv3tectsaksdag73oi7633arrzdlj77gmmywmvo',
      },
    },
    schedule: {
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: '*',
    },
    locked: false,
    credential: 'Storj',
    next_run_time: '2025-01-08T08:00:00.000Z',
    state: {
      state: 'PENDING',
    },
    last_run: 'Disabled',
  } as CloudSyncTaskUi;

  let loader: HarnessLoader;
  let spectator: Spectator<CloudSyncFormComponent>;
  const getData = jest.fn(() => existingTask);
  const slideInRef: SlideInRef<CloudSyncTaskUi, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
    swap: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: CloudSyncFormComponent,
    imports: [
      CloudCredentialsSelectComponent,
      ReactiveFormsModule,
      TransferModeExplanationComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('cloudsync.create', existingTask),
        mockCall('cloudsync.update', existingTask),
        mockCall('cloudsync.credentials.query', [
          {
            id: 1,
            name: 'test1',
            provider: {
              type: CloudSyncProviderName.Http,
              url: 'http',
            },
          },
          {
            id: 2,
            name: 'test2',
            provider: {
              type: CloudSyncProviderName.Mega,
              user: 'login',
              pass: 'password',
            },
          },
        ]),
        mockCall('cloudsync.providers', [{
          name: CloudSyncProviderName.Http,
          title: 'Http',
          buckets: false,
          bucket_title: 'Bucket',
          task_schema: [],
          credentials_schema: [],
          credentials_oauth: null,
        },
        {
          name: CloudSyncProviderName.Mega,
          title: 'Mega',
          buckets: false,
          bucket_title: 'Bucket',
          task_schema: [],
          credentials_schema: [],
          credentials_oauth: null,
        }]),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(FilesystemService),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  describe('adds a new cloudsync', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds a new cloudsync task when new form is saved', async () => {
      spectator.component.form.patchValue({
        description: 'New Cloud Sync Task',
        credentials: 1,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('cloudsync.create', [{
        attributes: { folder: '/' },
        bwlimit: [],
        create_empty_src_dirs: false,
        credentials: 1,
        description: 'New Cloud Sync Task',
        direction: Direction.Pull,
        enabled: true,
        encryption: false,
        exclude: [],
        include: [],
        follow_symlinks: false,
        path: mntPath,
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
        transfer_mode: TransferMode.Copy,
        transfers: 4,
      }]);
      expect(slideInRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });

  describe('edits a new cloudsync', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData,
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing cloudsync task when it is open for edit', () => {
      expect(spectator.component.form.value).toEqual({
        acknowledge_abuse: false,
        bwlimit: ['13:00, 1 KiB/s', '15:00, off'],
        cloudsync_picker: '0 0 * * 0',
        create_empty_src_dirs: true,
        credentials: 2,
        description: 'New Cloud Sync Task',
        direction: Direction.Push,
        enabled: false,
        encryption: true,
        encryption_password: 'password',
        encryption_salt: 'salt',
        exclude: [],
        filename_encryption: true,
        folder_destination: ['/test/'],
        follow_symlinks: true,
        path_source: ['/mnt/my pool'],
        post_script: 'test post-script',
        pre_script: 'test pre-script',
        transfer_mode: TransferMode.Copy,
        snapshot: false,
        transfers: 2,
      });
    });

    it('saves updated cloudsync task when form opened for edit is saved', async () => {
      // TODO: Rewrite to interact with controls instead of setting form directly.
      spectator.component.form.patchValue({
        description: 'Edited description',
        direction: Direction.Pull,
        folder_source: ['/mnt/path1', '/mnt/path2'],
        encryption: false,
        transfers: 10,
        bwlimit: ['9:00', '12:30, 2048'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('cloudsync.update', [1, {
        attributes: { folder: mntPath },
        bwlimit: [
          { bandwidth: undefined, time: '9:00' },
          { bandwidth: '2048', time: '12:30' },
        ],
        create_empty_src_dirs: true,
        credentials: 2,
        description: 'Edited description',
        direction: Direction.Pull,
        enabled: false,
        encryption: false,
        exclude: [],
        follow_symlinks: true,
        include: ['/path1/**', '/path2/**'],
        path: mntPath,
        post_script: 'test post-script',
        pre_script: 'test pre-script',
        schedule: {
          dom: '*',
          dow: '0',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: false,
        transfer_mode: TransferMode.Copy,
        transfers: 10,
      }]);
      expect(slideInRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });

    it('checks payload when use invalid s3 credentials', async () => {
      spectator.component.isCredentialInvalid$.next(true);
      spectator.detectChanges();

      const bucketInput = await loader.getHarness(IxInputHarness.with({ label: 'Bucket' }));
      await bucketInput.setValue('selected');

      expect(spectator.component.getPayload()).toEqual(expect.objectContaining({
        attributes: expect.objectContaining({
          bucket: 'selected',
        }),
      }));

      await bucketInput.setValue('test-bucket');
      expect(spectator.component.getPayload()).toEqual(expect.objectContaining({
        attributes: expect.objectContaining({
          bucket: 'test-bucket',
        }),
      }));
    });
  });

  describe('doesnt load buckets when user doesnt has roles', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => existingTask2),
          }),
          mockProvider(CloudCredentialService, {
            getProviders: jest.fn(() => {
              return of([{
                name: CloudSyncProviderName.Http,
                title: 'Http',
                buckets: false,
                bucket_title: 'Bucket',
                task_schema: [],
                credentials_schema: [],
                credentials_oauth: null,
              },
              {
                name: CloudSyncProviderName.Mega,
                title: 'Mega',
                buckets: false,
                bucket_title: 'Bucket',
                task_schema: [],
                credentials_schema: [],
                credentials_oauth: null,
              },
              {
                name: CloudSyncProviderName.Storj,
                title: 'Storj',
                credentials_oauth: null,
                credentials_schema: [],
                buckets: true,
                bucket_title: 'Bucket',
                task_schema: [
                  {
                    property: 'fast_list',
                    schema: {
                      type: 'boolean',
                      _name_: 'fast_list',
                      title: 'Use --fast-list',
                      description: 'Use fewer transactions in exchange for more RAM. This may also speed up or slow down your\ntransfer. See [rclone documentation](https://rclone.org/docs/#fast-list) for more details.',
                      default: false,
                      _required_: false,
                    },
                  },
                ],
              }]);
            }),
            getCloudSyncCredentials: jest.fn(() => {
              return of([
                {
                  id: 1,
                  name: 'Storj',
                  provider: {
                    type: CloudSyncProviderName.Storj,
                    url: '',
                    access_key_id: 'julzdrlwyv37oixflnbyysbumg3q',
                    secret_access_key: 'jyncyw7oup4ad2fv3tectsaksdag73oi7633arrzdlj77gmmywmvo',
                  },
                },
              ]);
            }),
          }),
          mockProvider(AuthService, {
            hasRole: jest.fn(() => of(false)),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.detectChanges();
    });

    it('doesnt load buckets', async () => {
      const buckets = await loader.getHarness(IxSelectHarness.with({ label: 'Bucket' }));
      const options = await buckets.getOptionLabels();
      expect(options).toEqual(['--', 'test3']);
    });
  });
});
