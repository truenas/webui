import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnSelectHarness, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { fakeDate, restoreDate } from 'app/core/testing/utils/mock-clock.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { Job } from 'app/interfaces/job.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import {
  TableColumnPickerComponent,
} from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationListComponent } from 'app/pages/data-protection/replication/replication-list/replication-list.component';
import { ReplicationRestoreDialog } from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';
import { ReplicationWizardComponent } from '../replication-wizard/replication-wizard.component';

const tasks = [{
  id: 1,
  target_dataset: 'pewl',
  recursive: false,
  compression: null,
  speed_limit: null,
  enabled: false,
  direction: Direction.Push,
  transport: TransportMode.Local,
  source_datasets: [
    'pewl',
  ],
  exclude: [],
  naming_schema: [],
  name_regex: null,
  auto: true,
  only_matching_schedule: false,
  readonly: ReadOnlyMode.Set,
  allow_from_scratch: false,
  hold_pending_snapshots: false,
  retention_policy: RetentionPolicy.Source,
  lifetime_unit: null,
  lifetime_value: null,
  large_block: true,
  embed: false,
  compressed: true,
  retries: 5,
  logging_level: null,
  name: 'pewl - pewl',
  state: {
    state: TaskState.Hold,
    datetime: {
      $date: new Date('2026-01-19T23:59:10Z').getTime(),
    },
    reason: 'Pool pewl is offline.',
  },
  properties: true,
  replicate: false,
  encryption: false,
  has_encrypted_dataset_keys: true,
  periodic_snapshot_tasks: [
    {
      id: 1,
      dataset: 'pewl',
      recursive: false,
      lifetime_value: 2,
      lifetime_unit: LifetimeUnit.Week,
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
    },
  ] as PeriodicSnapshotTask[],
  also_include_naming_schema: [],
  schedule: null,
  restrict_schedule: null,
  job: null,
}] as ReplicationTask[];

describe('ReplicationListComponent', () => {
  let spectator: Spectator<ReplicationListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  beforeEach(() => fakeDate(new Date('2026-01-20T00:00:00Z')));
  afterEach(() => restoreDate());

  const createComponent = createComponentFactory({
    component: ReplicationListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      IxTableDetailsRowComponent,
      TableColumnPickerComponent,
    ],
    providers: [
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectJobs,
            value: [{ id: 2, state: JobState.Success } as Job],
          },
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('replication.query', tasks),
        mockCall('replication.update', { ...tasks[0], enabled: true }),
        mockJob('replication.run', fakeSuccessfulJob()),
        mockCall('replication.delete'),
      ]),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(DownloadService, {
        coreDownload: jest.fn(() => of(undefined)),
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
      'Name', 'Direction', 'Last Run', 'State', 'Enabled', 'Last Snapshot',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      ['pewl - pewl', 'PUSH', '1 min. ago', 'Hold', '', 'No snapshots sent yet'],
    ]);
  });

  it('expands the detail row when the row itself is clicked', async () => {
    expect(await table.isRowExpanded(0)).toBe(false);

    await table.clickRow(0);

    expect(await table.isRowExpanded(0)).toBe(true);
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');
    await table.toggleRowExpansion(0);

    const runNowButton = await loader.getHarness(TnButtonHarness.with({ label: 'Run Now' }));
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      message: 'Replicate «pewl - pewl» now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('replication.run', [1]);
  });

  it('shows wizard when the add button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      ReplicationWizardComponent,
      {
        title: 'Replication Task Wizard',
        wide: true,
        footerless: true,
      },
    );
  });

  it('shows form to edit an existing interface when edit button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      ReplicationFormComponent,
      {
        title: 'Edit Replication Task',
        wide: true,
        inputs: { replicationToEdit: expect.objectContaining(tasks[0]) },
      },
    );
  });

  it('deletes a task with confirmation when delete button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      message: 'Delete Replication Task <b>"pewl - pewl"</b>?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('replication.delete', [1]);
  });

  it('shows dialog when Restore button is pressed', async () => {
    await table.toggleRowExpansion(0);

    jest.spyOn(spectator.inject(TnDialog), 'open');

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Restore' }));
    await editButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ReplicationRestoreDialog, {
      data: 1,
    });
  });

  it('updates task enabled status once slide-toggle is updated', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

    expect(await toggle.isChecked()).toBe(false);

    await toggle.toggle();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'replication.update',
      [1, { enabled: true }],
    );
  });

  // The visible `Enabled` column renders as a toggle from the template, but the picker can
  // hide it, and <ix-table-details-row> then renders it through the ix cell components — where
  // a toggle would have no `onRowToggle`/`requiredRoles`. It has to fall back to plain yes/no.
  it('renders the hidden Enabled column as text, not a toggle, in the detail row', async () => {
    const picker = await loader.getHarness(TnSelectHarness.with({ ancestor: 'ix-table-column-picker' }));
    await picker.open();
    await picker.selectOption('Enabled');
    spectator.detectChanges();

    expect(await table.getHeaderTexts()).not.toContain('Enabled');

    await table.toggleRowExpansion(0);

    expect(spectator.query('ix-table-details-row')).toHaveText('Enabled');
    expect(await loader.getAllHarnesses(TnSlideToggleHarness)).toHaveLength(0);
  });

  it('checks if downloads encryption keys when button is pressed', async () => {
    await table.toggleRowExpansion(0);

    jest.spyOn(spectator.inject(TnDialog), 'open');

    const downloadKeysButtons = await loader.getHarness(TnButtonHarness.with({ label: 'Download Keys' }));
    await downloadKeysButtons.click();

    expect(spectator.inject(DownloadService).coreDownload).toHaveBeenCalledWith({
      arguments: [1],
      fileName: 'pewl - pewl_encryption_keys.json',
      method: 'pool.dataset.export_keys_for_replication',
      mimeType: 'application/json',
    });
  });
});
