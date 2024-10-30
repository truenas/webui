import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { CloudBackupSnapshotsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-snapshots/cloud-backup-snapshots.component';
import { SlideInService } from 'app/services/slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

const cloudBackupSnapshots = [
  {
    id: 'first',
    hostname: 'older',
    time: {
      $date: new Date().getTime() - 500000,
    },
  },
  {
    id: 'second',
    hostname: 'recent',
    time: {
      $date: new Date().getTime() - 30000,
    },
  },
] as CloudBackupSnapshot[];

describe('CloudBackupSnapshotsComponent', () => {
  let spectator: Spectator<CloudBackupSnapshotsComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: CloudBackupSnapshotsComponent,
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('cloud_backup.list_snapshots', cloudBackupSnapshots),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(StorageService),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(SlideInRef, {
        slideInClosed$: of(true),
      }),
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
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        backup: {
          id: 1,
        } as CloudBackup,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Snapshots');
  });

  it('handles restore functionality', async () => {
    const slideInService = spectator.inject(SlideInService);

    const restoreButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'restore' }), 1, 2);
    await restoreButton.click();

    expect(slideInService.open).toHaveBeenCalledWith(CloudBackupRestoreFromSnapshotFormComponent, {
      data: {
        backup: { id: 1 } as CloudBackup,
        snapshot: cloudBackupSnapshots[1],
      },
    });
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Snapshot Time', 'Hostname', ''],
      ['1 min. ago', 'recent', ''],
      ['8 min. ago', 'older', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 2);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloud_backup.delete_snapshot', [1, 'second']);
  });
});
