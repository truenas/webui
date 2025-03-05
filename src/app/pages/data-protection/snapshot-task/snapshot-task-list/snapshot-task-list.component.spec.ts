import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent, MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxCellScheduleComponent,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { SnapshotTaskListComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.component';
import { TaskService } from 'app/services/task.service';

describe('SnapshotTaskListComponent', () => {
  let spectator: Spectator<SnapshotTaskListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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

  const slideInRef: SlideInRef<PeriodicSnapshotTaskUi | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: SnapshotTaskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
      IxTableDetailsRowDirective,
      IxTableDetailsRowComponent,
    ],
    overrideComponents: [
      [
        IxCellScheduleComponent, {
          remove: { imports: [ScheduleDescriptionPipe] },
          add: { imports: [MockPipe(ScheduleDescriptionPipe, jest.fn(() => 'At 12:00 AM, every day'))] },
        },
      ],
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.snapshottask.query', snapshotTasksList),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in about 10 hours'),
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
    await table.expandRow(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      SnapshotTaskFormComponent,
      {
        wide: true,
        data: snapshotTasksList[0],
      },
    );

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.query');
  });

  it('deletes a Cloud Sync with confirmation when Delete button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');

    await table.expandRow(0);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Periodic Snapshot Task <b>"m60pool/manual-2024-02-05_11-19-clone - auto-%Y-%m-%d_%H-%M"</b>?',
      buttonColor: 'warn',
      buttonText: 'Delete',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.query');
  });
});
