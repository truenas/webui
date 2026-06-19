import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnDialog, TnTableHarness } from '@truenas/ui-components';
import { MockComponent, MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { User } from 'app/interfaces/user.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronDeleteDialog } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from 'app/pages/system/advanced/cron/cron-list/cron-list.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { TaskService } from 'app/services/task.service';
import { UserService } from 'app/services/user.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemConfigState, selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('CronListComponent', () => {
  let spectator: Spectator<CronListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const cronJobs = [
    {
      id: 1,
      user: 'root',
      command: "echo 'Hello World'",
      description: 'test',
      enabled: true,
      stdout: true,
      stderr: false,
      schedule: {
        minute: '0',
        hour: '0',
        dom: '*',
        month: '*',
        dow: '*',
      },
    },
  ];

  const createComponent = createComponentFactory({
    component: CronListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    overrideComponents: [
      [
        CronListComponent, {
          remove: { imports: [ScheduleDescriptionPipe] },
          add: { imports: [MockPipe(ScheduleDescriptionPipe, jest.fn(() => 'At 00:00, every day'))] },
        },
      ],
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectPreferences,
            value: {},
          },
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
      mockApi([
        mockCall('cronjob.query', cronJobs),
        mockCall('cronjob.run'),
        mockCall('cronjob.create'),
        mockCall('cronjob.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(UserService, {
        userQueryDsCache: () => of([{ username: 'root' }] as User[]),
        getUserByName: (username: string) => of({ username } as User),
        getUserByNameCached: (username: string) => of({ username } as User),
      }),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => new Date(new Date().getTime() + (25 * 60 * 60 * 1000))),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Users', 'Command', 'Description', 'Schedule', 'Enabled', 'Next Run',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      ['root', "echo 'Hello World'", 'test', 'At 00:00, every day', 'Yes', expect.any(String)],
    ]);
  });

  it('opens the Add Cron Job form in a side panel when Add is pressed', async () => {
    expect(spectator.query('ix-cron-form')).toBeNull();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.query('ix-cron-form')).not.toBeNull();
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const runNowButton = await loader.getHarness(TnButtonHarness.with({ label: 'Run Now' }));
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      message: 'Run this job now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cronjob.run', [1]);
  });

  it('opens the Edit Cron Job form in the side panel with the selected row', async () => {
    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();
    spectator.detectChanges();

    const form = spectator.query(CronFormComponent);
    expect(form).not.toBeNull();
    expect(form.editCronjob()).toEqual(expect.objectContaining(cronJobs[0]));
  });

  it('deletes a cronjob with confirmation when Delete button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(CronDeleteDialog, {
      data: expect.objectContaining({ id: 1 }),
    });
  });
});
