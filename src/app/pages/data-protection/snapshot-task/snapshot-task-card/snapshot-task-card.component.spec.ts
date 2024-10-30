import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnapshotTaskCardComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.component';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('SnapshotTaskCardComponent', () => {
  let spectator: Spectator<SnapshotTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const snapshotTasks = [
    {
      id: 1,
      dataset: 'APPS/test2',
      recursive: false,
      lifetime_value: 2,
      lifetime_unit: 'WEEK',
      enabled: false,
      exclude: [],
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      allow_empty: true,
      schedule: {
        minute: '0',
        hour: '0',
        dom: '*',
        month: '*',
        dow: '*',
        begin: '00:00',
        end: '23:59',
      },
      vmware_sync: false,
      state: {
        state: 'PENDING',
        datetime: {
          $date: new Date().getTime() - 50000,
        },
      },
      keepfor: '2 WEEK(S)',
      cron_schedule: '0 0 * * *',
      frequency: 'At 00:00, every day',
      next_run: 'in about 6 hours',
    } as PeriodicSnapshotTask,
  ];

  const createComponent = createComponentFactory({
    component: SnapshotTaskCardComponent,
    imports: [
    ],
    providers: [
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
        ],
      }),
      mockWebSocket([
        mockCall('pool.snapshottask.query', snapshotTasks),
        mockCall('pool.snapshottask.delete'),
        mockCall('pool.snapshottask.update'),
        mockCall('cronjob.run'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => new Date(new Date().getTime() + (25 * 60 * 60 * 1000))),
        getTaskCronDescription: jest.fn(() => 'At 00:00, every day'),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Pool/Dataset', 'Keep for', 'Frequency', 'Next Run', 'Last Run', 'Enabled', 'State', ''],
      ['APPS/test2', '2 week(s)', 'At 00:00, every day', 'Disabled', '1 min. ago', '', 'PENDING', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Snapshot Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 7);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SnapshotTaskFormComponent, {
      data: snapshotTasks[0],
      wide: true,
    });
  });

  it('shows form to create new Snapshot Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SnapshotTaskFormComponent, {
      data: undefined,
      wide: true,
    });
  });

  it('deletes a Snapshot Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 7);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Periodic Snapshot Task <b>"APPS/test2 - auto-%Y-%m-%d_%H-%M"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.delete', [1]);
  });

  it('updates Snapshot Task Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 5);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'pool.snapshottask.update',
      [1, { enabled: true }],
    );
  });
});
