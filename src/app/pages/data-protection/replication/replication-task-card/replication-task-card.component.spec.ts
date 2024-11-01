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
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationRestoreDialogComponent } from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ReplicationTaskCardComponent } from 'app/pages/data-protection/replication/replication-task-card/replication-task-card.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { DownloadService } from 'app/services/download.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('ReplicationTaskCardComponent', () => {
  let spectator: Spectator<ReplicationTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;
  let ws: WebSocketService;

  const replicationTasks = [
    {
      id: 1,
      target_dataset: 'APPS/test3',
      enabled: false,
      direction: 'PUSH',
      transport: 'LOCAL',
      source_datasets: [
        'APPS/test2',
      ],
      has_encrypted_dataset_keys: true,
      name: 'APPS/test2 - APPS/test3',
      state: {
        state: 'FINISHED',
        warnings: [],
        last_snapshot: 'APPS/test2@auto-2023-09-19_00-00',
        datetime: {
          $date: new Date().getTime() - 50000,
        },
      },
      restrict_schedule: null,
      job: null,
    } as ReplicationTask,
  ];

  const createComponent = createComponentFactory({
    component: ReplicationTaskCardComponent,
    imports: [
    ],
    providers: [
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectGeneralConfig,
            value: {
              timezone: 'Europe/Kiev',
            },
          },
          {
            selector: selectPreferences,
            value: {},
          },
          {
            selector: selectSystemConfigState,
            value: {},
          },
        ],
      }),
      mockWebSocket([
        mockCall('replication.query', replicationTasks),
        mockCall('core.get_jobs', []),
        mockCall('replication.delete'),
        mockCall('replication.update'),
        mockCall('core.download', [undefined, 'http://someurl/file.json']),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of()),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(DownloadService, {
        streamDownloadFile: jest.fn(() => of()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
    ws = spectator.inject(WebSocketService);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Last Snapshot', 'Enabled', 'State', 'Last Run', ''],
      ['APPS/test2 - APPS/test3', 'APPS/test2@auto-2023-09-19_00-00', '', 'FINISHED', '1 min. ago', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Replication Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      ReplicationFormComponent,
      true,
      replicationTasks[0],
    );
  });

  it('shows form to create new Replication Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      ReplicationWizardComponent,
      true,
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-play-circle' }), 1, 5);
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Replicate «APPS/test2 - APPS/test3» now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('replication.run', [1]);
  });

  it('shows dialog when Restore button is pressed', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open');
    const restoreButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'restore' }), 1, 5);
    await restoreButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ReplicationRestoreDialogComponent, {
      data: 1,
    });
  });

  it('downloads Encryption Keys', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open');
    const downloadButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-download' }), 1, 5);
    await downloadButton.click();

    expect(ws.call).toHaveBeenCalledWith('core.download', [
      'pool.dataset.export_keys_for_replication',
      [1],
      'APPS/test2 - APPS/test3_encryption_keys.json',
    ]);
    expect(spectator.inject(DownloadService).streamDownloadFile).toHaveBeenCalledWith(
      'http://someurl/file.json',
      'APPS/test2 - APPS/test3_encryption_keys.json',
      'application/json',
    );
  });

  it('deletes a Replication Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Replication Task <b>"APPS/test2 - APPS/test3"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('replication.delete', [1]);
  });

  it('updates Replication Task Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'replication.update',
      [1, { enabled: true }],
    );
  });
});
