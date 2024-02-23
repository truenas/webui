import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { SnapshotTaskListComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SnapshotTaskListComponent', () => {
  let spectator: Spectator<SnapshotTaskListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const snapshotTasksList = [
    {
      id: 1,
      dataset: 'm60pool/manual-2024-02-05_11-19-clone',
      recursive: false,
      lifetime_value: 155,
      lifetime_unit: 'WEEK',
      enabled: true,
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
      },
    } as PeriodicSnapshotTaskUi,
  ];

  const createComponent = createComponentFactory({
    component: SnapshotTaskListComponent,
    imports: [
      AppLoaderModule,
      IxTable2Module,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('pool.snapshottask.query', snapshotTasksList),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in about 10 hours'),
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
      ['Pool/Dataset', 'Recursive', 'Naming Schema', 'When', 'Frequency', 'Enabled', 'State'],
      [
        'm60pool/manual-2024-02-05_11-19-clone',
        'No',
        'auto-%Y-%m-%d_%H-%M',
        'From 00:00 to 23:59',
        'At 12:00 AM, every day',
        'Yes',
        'PENDING',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing task when Edit button is pressed', async () => {
    await table.clickToggle(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      SnapshotTaskFormComponent,
      {
        wide: true,
        data: snapshotTasksList[0],
      },
    );

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.query');
  });

  it('deletes a Cloud Sync with confirmation when Delete button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');

    await table.clickToggle(0);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Periodic Snapshot Task <b>"m60pool/manual-2024-02-05_11-19-clone - auto-%Y-%m-%d_%H-%M"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.query');
  });
});
