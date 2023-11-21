import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { RsyncTaskListComponent } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('RsyncTaskListComponent', () => {
  let spectator: Spectator<RsyncTaskListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const tasks = [
    {
      id: 1,
      enabled: true,
      desc: 'My task',
      direction: Direction.Pull,
      path: '/mnt/Pool1',
      remotehost: 'server.com',
      remotemodule: 'my_module',
      schedule: {
        'minute': '0',
        'hour': '*',
        'dom': '*',
        'month': '*',
        'dow': '*',
      },
      user: 'bob',
      job: {
        'state': JobState.Running,
      } as Job,
    },
    {
      id: 1,
      enabled: false,
      desc: 'Second task',
      direction: Direction.Push,
      path: '/mnt/Pool2',
      remotehost: 'server.com',
      remotemodule: '',
      schedule: {
        'minute': '0',
        'hour': '0',
        'dom': '1',
        'month': '*',
        'dow': '*',
      },
      user: 'peter',
      job: {
        'state': JobState.Finished,
      } as Job,
    },
  ] as RsyncTask[];

  const createComponent = createComponentFactory({
    component: RsyncTaskListComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebsocket([
        mockCall('rsynctask.query', tasks),
        mockCall('rsynctask.delete'),
        mockJob('rsynctask.run', fakeSuccessfulJob()),
      ]),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in about 10 hours'),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('shows table rows', async () => {
    const expectedRows = [
      [
        'Path',
        'Remote Host',
        'Remote Module Name',
        'Direction',
        'Frequency',
        'Next Run',
        'Short Description',
        'User',
        'Status',
        'Enabled',
        '',
      ],
      [
        '/mnt/Pool1',
        'server.com',
        'my_module',
        'PULL',
        'Every hour',
        'N/A',
        'My task',
        'bob',
        'RUNNING',
        'Yes',
        '',
      ],
      [
        '/mnt/Pool2',
        'server.com',
        '',
        'PUSH',
        'At 12:00 AM, on day 1 of the month',
        'N/A',
        'Second task',
        'peter',
        'FINISHED',
        'No',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens edit form when Edit icon is pressed', async () => {
    const editIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), '/mnt/Pool1');
    await editIcon.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(RsyncTaskFormComponent, {
      data: tasks[0],
      wide: true,
    });
  });

  it('deletes a network interface with confirmation when Delete icon is pressed', async () => {
    const deleteIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'delete' }), '/mnt/Pool1');
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Are you sure you want to delete this task?',
    }));
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('rsynctask.delete', [1]);
  });

  it('runs a task when run button is pressed', async () => {
    const runIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'play_arrow' }), '/mnt/Pool1');
    await runIcon.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('rsynctask.run', [1]);
  });
});
