import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnSelectHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import {
  TableColumnPickerComponent,
} from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { RsyncTaskListComponent } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.component';
import { TaskService } from 'app/services/task.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('RsyncTaskListComponent', () => {
  let spectator: Spectator<RsyncTaskListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

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
        minute: '0',
        hour: '*',
        dom: '*',
        month: '*',
        dow: '*',
      },
      user: 'bob',
      job: {
        id: 1,
        state: JobState.Running,
      } as Job,
    },
    {
      id: 2,
      enabled: false,
      desc: 'Second task',
      direction: Direction.Push,
      path: '/mnt/Pool2',
      remotehost: 'server.com',
      remotemodule: '',
      schedule: {
        minute: '0',
        hour: '0',
        dom: '1',
        month: '*',
        dow: '*',
      },
      user: 'peter',
      job: {
        id: 2,
        state: JobState.Success,
      } as Job,
    },
  ] as RsyncTask[];

  const createComponent = createComponentFactory({
    component: RsyncTaskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      TableColumnPickerComponent,
    ],
    providers: [
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockAuth(),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockApi([
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
          {
            selector: selectGeneralConfig,
            value: {
              timezone: 'Europe/Kiev',
            },
          },
          {
            selector: selectPreferences,
            value: {},
          },
          {
            selector: selectJobs,
            value: [
              {
                id: 1,
                state: JobState.Running,
              },
              {
                id: 2,
                state: JobState.Success,
              },
            ],
          },
        ],
      }),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const [trigger] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    const expectedHeaders = [
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
      'Actions',
    ];
    const expectedRows = [
      [
        '/mnt/Pool1',
        'server.com',
        'my_module',
        'PULL',
        'Every hour, every day',
        'N/A',
        'My task',
        'bob',
        'Running',
        'Yes',
        '',
      ],
      [
        '/mnt/Pool2',
        'server.com',
        '',
        'PUSH',
        'At 00:00 (12:00 AM), on day 1 of the month',
        'Disabled',
        'Second task',
        'peter',
        'Completed',
        'No',
        '',
      ],
    ];

    expect(await table.getHeaderTexts()).toEqual(expectedHeaders);
    expect(await table.getAllRowTexts()).toEqual(expectedRows);
  });

  // `Frequency` has no propertyName, so it only reaches tn-table through the explicit
  // `columnName` -> `[tnColumnDef]` pairing. Deselecting it in the picker proves the
  // picker model and `toDisplayedColumns` still agree for a computed column.
  it('hides a computed column in the table when the column picker deselects it', async () => {
    expect(await table.getHeaderTexts()).toContain('Frequency');

    const picker = await loader.getHarness(TnSelectHarness.with({ ancestor: 'ix-table-column-picker' }));
    await picker.open();
    await picker.selectOption('Frequency');
    spectator.detectChanges();

    expect(await table.getHeaderTexts()).not.toContain('Frequency');
  });

  it('sorts through the data provider when a sortable header is clicked', async () => {
    jest.spyOn(spectator.component.dataProvider, 'setSorting');

    await table.clickSortHeader('path');

    expect(spectator.component.dataProvider.setSorting).toHaveBeenCalledWith({
      propertyName: 'path',
      direction: SortDirection.Asc,
      active: 0,
    });
    expect(await table.getSortDirection('path')).toBe('ascending');
  });

  it('opens edit form when Edit icon is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      RsyncTaskFormComponent,
      {
        title: 'Edit Rsync Task',
        wide: true,
        inputs: { taskToEdit: tasks[0] },
      },
    );
  });

  it('deletes a network interface with confirmation when Delete icon is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.delete', [1]);
  });

  it('runs a task when run button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Run job' });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('rsynctask.run', [1]);
  });
});
