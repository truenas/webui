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
import { Job } from 'app/interfaces/job.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { RsyncTaskCardComponent } from 'app/pages/data-protection/rsync-task/rsync-task-card/rsync-task-card.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

describe('RsyncTaskCardComponent', () => {
  let spectator: Spectator<RsyncTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const rsyncTasks = [
    {
      id: 1,
      path: '/mnt/APPS',
      remotehost: 'asd',
      remoteport: null,
      remotemodule: 'asdad',
      desc: 'asd',
      user: 'test',
      recursive: true,
      times: true,
      compress: true,
      archive: false,
      delete: false,
      quiet: false,
      preserveperm: false,
      preserveattr: false,
      extra: [],
      enabled: false,
      mode: 'MODULE',
      remotepath: '',
      direction: 'PUSH',
      delayupdates: true,
      job: null,
      ssh_credentials: null,
      schedule: {
        minute: '0',
        hour: '*',
        dom: '*',
        month: '*',
        dow: '*',
      },
      locked: false,
      cron_schedule: '0 * * * *',
      frequency: 'Every hour, every day',
      next_run: 'in 33 minutes',
      state: {
        state: 'FAILED',
      },
    } as unknown as RsyncTaskUi,
  ];

  const createComponent = createComponentFactory({
    component: RsyncTaskCardComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectJob(1),
            value: {} as Job,
          },
        ],
      }),
      mockWebsocket([
        mockCall('rsynctask.query', rsyncTasks),
        mockCall('rsynctask.delete'),
        mockCall('rsynctask.update'),
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
      ['Path', 'Remote Host', 'Frequency', 'Next Run', 'Enabled', 'State', ''],
      ['/mnt/APPS', 'asd', 'asd', 'in 33 minutes', '', '[object Object]', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Rsync Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 6);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(RsyncTaskFormComponent, {
      data: rsyncTasks[0],
      wide: true,
    });
  });

  it('shows form to create new Rsync Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(RsyncTaskFormComponent, {
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
      message: 'Run this rsync now?',
      hideCheckbox: true,
    });
  });

  it('deletes a Rsync Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 6);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Rsync Task <b>\"asd - asdad\"</b>?',
    });
  });

  it('updates Rsync Task Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 4);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'rsynctask.update',
      [1, { enabled: true }],
    );
  });
});
