import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction } from 'app/enums/direction.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { DialogService } from 'app/services/dialog.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudsyncFormComponent', () => {
  const existingTask = {
    id: 1,
    description: 'New Cloud Sync Task',
    direction: Direction.Push,
    path: '/mnt/my pool',
    attributes: { folder: '/test/' },
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
      provider: 'MEGA',
      attributes: { user: 'login', pass: 'password' },
    },
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
    cron_schedule: 'Disabled',
    frequency: 'At 00:00, only on Sunday',
    next_run_time: 'Disabled',
    next_run: 'Disabled',
    state: { state: 'PENDING' },
    last_run: '1 minute ago',
  } as CloudSyncTaskUi;

  let loader: HarnessLoader;
  let spectator: Spectator<CloudsyncFormComponent>;
  const createComponent = createComponentFactory({
    component: CloudsyncFormComponent,
    imports: [
      IxFormsModule,
      SchedulerModule,
      ReactiveFormsModule,
    ],
    declarations: [
      TransferModeExplanationComponent,
    ],
    providers: [
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('cloudsync.create'),
        mockCall('cloudsync.update'),
        mockCall('cloudsync.credentials.query', [
          {
            id: 1,
            name: 'test1',
            provider: CloudsyncProviderName.Http,
            attributes: {
              url: 'http',
            },
          },
          {
            id: 2,
            name: 'test2',
            provider: CloudsyncProviderName.Mega,
            attributes: {
              user: 'login',
              pass: 'password',
            },
          },
        ]),
        mockCall('cloudsync.providers', [{
          name: CloudsyncProviderName.Http,
          title: 'Http',
          buckets: false,
          bucket_title: 'Bucket',
          task_schema: [],
          credentials_schema: [],
          credentials_oauth: null,
        },
        {
          name: CloudsyncProviderName.Mega,
          title: 'Mega',
          buckets: false,
          bucket_title: 'Bucket',
          task_schema: [],
          credentials_schema: [],
          credentials_oauth: null,
        }]),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FilesystemService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('cloudsync.create', [{
        attributes: { folder: '/' },
        bwlimit: [],
        create_empty_src_dirs: false,
        credentials: 1,
        description: 'New Cloud Sync Task',
        direction: Direction.Pull,
        enabled: true,
        encryption: false,
        exclude: [],
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
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edits a new cloudsync', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: existingTask },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing cloudsync task when it is open for edit', () => {
      expect(spectator.component.form.value).toEqual({
        acknowledge_abuse: false,
        bwlimit: ['13:00, 1 KiB', '15:00, off'],
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('cloudsync.update', [1, {
        attributes: { folder: mntPath },
        bwlimit: [
          { time: '9:00' },
          { bandwidth: 2097152, time: '12:30' },
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
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });
});
