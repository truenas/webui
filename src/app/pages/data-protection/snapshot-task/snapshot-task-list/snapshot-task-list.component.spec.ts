import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnSelectHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent, MockPipe } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { PeriodicSnapshotTaskUi, PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import {
  TableColumnPickerComponent,
} from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SnapshotTaskFormComponent,
} from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import {
  SnapshotTaskListComponent,
} from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.component';
import { TaskService } from 'app/services/task.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('SnapshotTaskListComponent', () => {
  let spectator: Spectator<SnapshotTaskListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  const event$ = new Subject<ApiEvent<PeriodicSnapshotTask>>();

  const snapshotTasksList = [
    {
      id: 1,
      dataset: 'm60pool/manual-2024-02-05_11-19-clone',
      recursive: false,
      lifetime_value: 155,
      lifetime_unit: LifetimeUnit.Week,
      enabled: true,
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
        state: TaskState.Pending,
      },
    } as PeriodicSnapshotTaskUi,
  ];

  const createComponent = createComponentFactory({
    component: SnapshotTaskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      TableColumnPickerComponent,
      IxTableDetailsRowComponent,
    ],
    overrideComponents: [
      [
        SnapshotTaskListComponent, {
          // Both arms: the template pipes `schedule` through it, and the column model calls the
          // provided instance so a detail row prints a description instead of `[object Object]`.
          remove: { imports: [ScheduleDescriptionPipe], providers: [ScheduleDescriptionPipe] },
          add: {
            imports: [MockPipe(ScheduleDescriptionPipe, jest.fn(() => 'At 12:00 AM, every day'))],
            providers: [mockProvider(ScheduleDescriptionPipe, { transform: () => 'At 12:00 AM, every day' })],
          },
        },
      ],
    ],
    providers: [
      mockAuth(),
      mockProvider(ApiService, {
        call: jest.fn((method) => {
          if (method === 'pool.snapshottask.query') {
            return of(snapshotTasksList);
          }
          if (method === 'pool.snapshottask.delete_will_change_retention_for') {
            return of({});
          }
          if (method === 'pool.snapshottask.delete') {
            return of(true);
          }
          return of(null);
        }),
        subscribe: jest.fn().mockReturnValue(event$),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of({ confirmed: true, secondaryCheckbox: false })),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in about 10 hours'),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Pool/Dataset', 'Recursive', 'Naming Schema', 'When', 'Frequency', 'Enabled', 'State',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      [
        'm60pool/manual-2024-02-05_11-19-clone',
        'No',
        'auto-%Y-%m-%d_%H-%M',
        'From 00:00 to 23:59',
        'At 12:00 AM, every day',
        'Yes',
        'Pending',
      ],
    ]);
  });

  it('expands the detail row when the row itself is clicked', async () => {
    expect(await table.isRowExpanded(0)).toBe(false);

    await table.clickRow(0);

    expect(await table.isRowExpanded(0)).toBe(true);
  });

  // A detail row prints text, so every column whose cell formats its value in the template has to
  // say how to print it — otherwise Frequency reads `[object Object]` and State reads `PENDING`.
  it('prints the hidden Frequency and State columns the way their cells render them', async () => {
    const picker = await loader.getHarness(TnSelectHarness.with({ ancestor: 'ix-table-column-picker' }));
    await picker.open();
    await picker.selectOption('Frequency');
    await picker.selectOption('State');
    spectator.detectChanges();

    await table.toggleRowExpansion(0);

    const detailsRow = spectator.query('ix-table-details-row');
    expect(detailsRow).toHaveText('Frequency:At 12:00 AM, every day');
    expect(detailsRow).toHaveText('State:Pending');
  });

  it('shows form to edit an existing task when Edit button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      SnapshotTaskFormComponent,
      {
        title: 'Edit Periodic Snapshot Task',
        wide: true,
        inputs: { taskToEdit: snapshotTasksList[0] },
      },
    );

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.query');
  });

  it('deletes a Cloud Sync with confirmation when Delete button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');

    await table.toggleRowExpansion(0);

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Periodic Snapshot Task <b>"m60pool/manual-2024-02-05_11-19-clone - auto-%Y-%m-%d_%H-%M"</b>?',
      buttonColor: 'warn',
      buttonText: 'Delete',
      secondaryCheckbox: false,
      secondaryCheckboxText: helptextSnapshotForm.keepSnapshotsLabel,
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.delete', [1, { fixate_removal_date: false }]);
  });

  it('reloads the data provider when an event is received from pool.snapshottask.query', () => {
    const api = spectator.inject(ApiService);
    expect(api.subscribe).toHaveBeenCalledWith('pool.snapshottask.query');

    jest.spyOn(spectator.component.dataProvider, 'load');

    event$.next({
      collection: 'pool.snapshottask.query',
      id: snapshotTasksList[0].id,
      msg: CollectionChangeType.Changed,
      fields: { state: { state: TaskState.Finished } } as PeriodicSnapshotTask,
    });

    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });
});
