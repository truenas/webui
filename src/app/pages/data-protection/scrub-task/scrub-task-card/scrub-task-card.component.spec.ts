import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { ScrubTaskCardComponent } from 'app/pages/data-protection/scrub-task/scrub-task-card/scrub-task-card.component';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ScrubTaskCardComponent', () => {
  let spectator: Spectator<ScrubTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const scrubTasks = [
    {
      id: 1,
      threshold: 35,
      description: 'cccc',
      enabled: false,
      pool: 1,
      pool_name: 'APPS',
      schedule: {
        minute: '00',
        hour: '00',
        dom: '*',
        month: '*',
        dow: '7',
      },
      cron_schedule: '00 00 * * 7',
      frequency: 'At 00:00, only on Sunday',
      next_run: 'in 3 days',
    },
  ] as ScrubTaskUi[];

  const createComponent = createComponentFactory({
    component: ScrubTaskCardComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.scrub.query', scrubTasks),
        mockCall('pool.scrub.delete'),
        mockCall('pool.scrub.update'),
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
        getTaskNextRun: jest.fn(() => 'in 3 days'),
        getTaskCronDescription: jest.fn(() => 'At 00:00, only on Sunday'),
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
      ['Pool', 'Description', 'Frequency', 'Next Run', 'Enabled', ''],
      ['APPS', 'cccc', 'At 00:00, only on Sunday', 'in 3 days', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Scrub Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ScrubTaskFormComponent, {
      data: expect.objectContaining(scrubTasks[0]),
    });
  });

  it('shows form to create new Scrub Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ScrubTaskFormComponent, {
      data: undefined,
    });
  });

  it('deletes a Scrub Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Scrub Task <b>\"APPS\"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.scrub.delete', [1]);
  });

  it('updates Scrub Task Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 4);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'pool.scrub.update',
      [1, { enabled: true }],
    );
  });
});
