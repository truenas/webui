import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall, mockJob } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { Job } from 'app/interfaces/job.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationListComponent } from 'app/pages/data-protection/replication/replication-list/replication-list.component';
import { ReplicationRestoreDialogComponent } from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { DownloadService } from 'app/services/download.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

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
    state: JobState.Hold,
    datetime: {
      $date: new Date().getTime() - 50000,
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
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: ReplicationListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      IxTableDetailsRowDirective,
      IxTableDetailsRowComponent,
      IxTableColumnsSelectorComponent,
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
      mockWebSocket([
        mockCall('replication.query', tasks),
        mockCall('replication.update', { ...tasks[0], enabled: true }),
        mockJob('replication.run', fakeSuccessfulJob()),
        mockCall('replication.delete'),
        mockCall('core.download', [undefined, 'http://someurl/file.json']),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(DownloadService, {
        streamDownloadFile: jest.fn(() => of()),
        downloadBlob: jest.fn(),
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
      ['Name', 'Direction', 'Last Run', 'State', 'Enabled', 'Last Snapshot'],
      ['pewl - pewl', 'PUSH', '1 min. ago', 'HOLD', '', 'No snapshots sent yet'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');
    await table.clickToggle(0);

    const runNowButton = await loader.getHarness(MatButtonHarness.with({ text: 'Run Now' }));
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Replicate «pewl - pewl» now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('replication.run', [1]);
  });

  it('shows form to edit an existing interface when edit button is pressed', async () => {
    await table.clickToggle(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      ReplicationFormComponent,
      true,
      expect.objectContaining(tasks[0]),
    );
  });

  it('deletes a task with confirmation when delete button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');

    await table.clickToggle(0);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Replication Task <b>"pewl - pewl"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('replication.delete', [1]);
  });

  it('shows dialog when Restore button is pressed', async () => {
    await table.clickToggle(0);

    jest.spyOn(spectator.inject(MatDialog), 'open');

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Restore' }));
    await editButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ReplicationRestoreDialogComponent, {
      data: 1,
    });
  });

  it('updates task enabled status once slide-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 4);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.toggle();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'replication.update',
      [1, { enabled: true }],
    );
  });

  it('checks if downloads encryption keys when button is pressed', async () => {
    await table.clickToggle(0);

    jest.spyOn(spectator.inject(MatDialog), 'open');

    const downloadKeysButtons = await loader.getHarness(MatButtonHarness.with({ text: 'Download Keys' }));
    await downloadKeysButtons.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', [
      'pool.dataset.export_keys_for_replication',
      [1],
      'pewl - pewl_encryption_keys.json',
    ]);
    expect(spectator.inject(DownloadService).streamDownloadFile).toHaveBeenCalledWith(
      'http://someurl/file.json',
      'pewl - pewl_encryption_keys.json',
      'application/json',
    );
  });
});
