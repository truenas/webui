import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncTaskCardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-task-card/cloudsync-task-card.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudSyncTaskCardComponent', () => {
  let spectator: Spectator<CloudSyncTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const cloudsyncTasks = [
    {
      id: 3,
      description: 'scru',
      path: '/mnt/APPS',
      attributes: {
        folder: '',
        fast_list: false,
        acknowledge_abuse: false,
      },
      pre_script: '',
      post_script: '',
      snapshot: false,
      include: [
        '//**',
        '/Folder1/**',
      ],
      transfers: 4,
      args: '',
      enabled: false,
      direction: 'PULL',
      transfer_mode: 'COPY',
      encryption: false,
      filename_encryption: false,
      encryption_password: '',
      encryption_salt: '',
      create_empty_src_dirs: false,
      follow_symlinks: false,
      credentials: {
        id: 1,
        name: 'Google Drive',
        provider: 'GOOGLE_DRIVE',
        attributes: {
          client_id: '',
          client_secret: '',
          token: '',
          team_drive: '',
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
      credential: 'Google Drive',
      cron_schedule: '0 0 * * *',
      frequency: 'At 00:00, every day',
      next_run_time: '2023-09-19T21:00:00.000Z',
      next_run: 'in about 21 hours',
      state: {
        state: 'RUNNING',
      },
      job: {
        id: 1,
        state: 'FINISHED',
        time_finished: {
          $date: new Date().getTime() - 50000,
        },
      },
    } as unknown as CloudSyncTaskUi,
  ];

  const createComponent = createComponentFactory({
    component: CloudSyncTaskCardComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectJobs,
            value: [{
              state: 'FINISHED',
              id: 1,
              time_finished: cloudsyncTasks[0].job.time_finished,
            } as Job],
          },
        ],
      }),
      mockWebsocket([
        mockCall('cloudsync.query', cloudsyncTasks),
        mockCall('cloudsync.delete'),
        mockCall('cloudsync.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in 33 minutes'),
        getTaskCronDescription: jest.fn(() => 'Every hour, every day'),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Description', 'Frequency', 'Next Run', 'Last Run', 'Enabled', 'State', ''],
      ['scru', 'Every hour, every day', 'Disabled', '1 minute ago', '', 'FINISHED', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing CloudSync Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 6);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudsyncFormComponent, {
      data: cloudsyncTasks[0],
      wide: true,
    });
  });

  it('shows form to create new CloudSync Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudsyncFormComponent, {
      data: undefined,
      wide: true,
    });
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');
    const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'play_arrow' }), 1, 6);
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run this Cloud Sync now?',
      hideCheckbox: true,
    });
  });

  it('shows confirmation dialog when Dry Run button is pressed', async () => {
    const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'sync' }), 1, 6);
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Test Cloud Sync',
      message: 'Start a dry run test of this cloud sync task? The  system will connect to the cloud service provider and simulate  transferring a file. No data will be sent or received.',
      hideCheckbox: true,
    });
  });

  it('shows confirmation dialog when Restore button is pressed', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open');
    const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'restore' }), 1, 6);
    await runNowButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CloudsyncRestoreDialogComponent, {
      data: 3,
    });
  });

  it('deletes a CloudSync Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 6);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Cloud Sync Task <b>\"scru\"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.delete', [3]);
  });

  it('updates CloudSync Task Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 4);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'cloudsync.update',
      [3, { enabled: true }],
    );
  });
});
