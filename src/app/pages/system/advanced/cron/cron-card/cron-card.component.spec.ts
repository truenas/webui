import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { CronCardComponent } from 'app/pages/system/advanced/cron/cron-card/cron-card.component';
import { CronDeleteDialogComponent } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { TaskService } from 'app/services/task.service';

describe('CronCardComponent', () => {
  let spectator: Spectator<CronCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

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
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('cronjob.query', cronJobs),
        mockCall('cronjob.run'),
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
        getTaskNextRun: jest.fn(() => 'in about 10 hours'),
      }),
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => Promise.resolve()),
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
      ['Users', 'Command', 'Description', 'Schedule', 'Enabled', ''],
      ['root', "echo 'Hello World'", 'test', '0 0 * * *', 'Yes', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');
    const runNowButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'play_arrow' }), 'root');
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run this job now?',
      hideCheckbox: true,
    });
  });

  it('shows form to edit an existing cronjob when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'root');
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CronFormComponent, {
      data: expect.objectContaining(cronJobs[0]),
    });
  });

  it('deletes a cronjob with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'delete' }), 'root');
    await deleteIcon.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CronDeleteDialogComponent, {
      data: expect.objectContaining({ id: 1 }),
    });
  });
});
