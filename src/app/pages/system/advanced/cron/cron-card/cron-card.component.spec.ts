import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { invalidDate } from 'app/constants/invalid-date';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxCellScheduleComponent,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronCardComponent } from 'app/pages/system/advanced/cron/cron-card/cron-card.component';
import { CronDeleteDialog } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { TaskService } from 'app/services/task.service';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('CronCardComponent', () => {
  let spectator: Spectator<CronCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
        IxCellScheduleComponent, {
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
        ],
      }),
      mockApi([
        mockCall('cronjob.query', cronJobs),
        mockCall('cronjob.run'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(SlideInRef, { close: jest.fn(), getData: jest.fn(() => undefined) }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => invalidDate),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Users', 'Command', 'Description', 'Schedule', 'Enabled', 'Next Run', ''],
      ['root', "echo 'Hello World'", 'test', 'At 00:00, every day', 'Yes', 'Invalid Date', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const runNowButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-play-circle' }), 'root');
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run this job now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cronjob.run', [1]);
  });

  it('shows form to edit an existing cronjob when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'root');
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      CronFormComponent,
      { data: expect.objectContaining(cronJobs[0]) },
    );
  });

  it('deletes a cronjob with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'root');
    await deleteIcon.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CronDeleteDialog, {
      data: expect.objectContaining({ id: 1 }),
    });
  });
});
