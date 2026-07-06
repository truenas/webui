import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { invalidDate } from 'app/constants/invalid-date';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { User } from 'app/interfaces/user.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronCardComponent } from 'app/pages/system/advanced/cron/cron-card/cron-card.component';
import { CronDeleteDialog } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { TaskService } from 'app/services/task.service';
import { UserService } from 'app/services/user.service';
import { selectSystemConfigState, selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('CronCardComponent', () => {
  let spectator: Spectator<CronCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  let formPanel: FormSidePanelService;

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
    component: CronCardComponent,
    overrideComponents: [
      [
        CronCardComponent, {
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
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
      }),
      mockProvider(LocaleService),
      mockProvider(UserService, {
        userQueryDsCache: () => of([{ username: 'root' }] as User[]),
        getUserByName: (username: string) => of({ username } as User),
        getUserByNameCached: (username: string) => of({ username } as User),
      }),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => invalidDate),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  async function openFirstRowMenu(): Promise<TnMenuHarness> {
    spectator.click(spectator.query('[data-test$="more-action"]') as HTMLElement);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
    formPanel = spectator.inject(FormSidePanelService);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Users', 'Command', 'Description', 'Schedule', 'Enabled', 'Next Run', '',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      ['root', "echo 'Hello World'", 'test', 'At 00:00, every day', 'Yes', 'Invalid Date', ''],
    ]);
  });

  it('opens the Add Cron Job form in a side panel when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(formPanel.open).toHaveBeenCalledWith(CronFormComponent, { title: 'Add Cron Job' });
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Run job' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run this job now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cronjob.run', [1]);
  });

  it('opens the Edit Cron Job form in the side panel with the selected row', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(formPanel.open).toHaveBeenCalledWith(CronFormComponent, {
      title: 'Edit Cron Job',
      inputs: { editCronjob: expect.objectContaining(cronJobs[0]) },
    });
  });

  it('deletes a cronjob with confirmation when Delete button is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(CronDeleteDialog, {
      data: expect.objectContaining({ id: 1 }),
    });
  });
});
