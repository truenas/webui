import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { CloudBackupSnapshotsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-snapshots/cloud-backup-snapshots.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';

const cloudBackupSnapshots: CloudBackupSnapshot[] = [
  {
    id: 'first',
    hostname: 'UA',
    time: {
      $date: 1718638850000,
    },
    paths: ['/mnt/nmnmn'],
    short_id: '',
    parent: '',
    username: '',
    tree: '',
    program_version: '',
  },
];

describe('CloudBackupSnapshotsComponent', () => {
  let spectator: Spectator<CloudBackupSnapshotsComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: CloudBackupSnapshotsComponent,
    imports: [
      IxTableModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('cloud_backup.list_snapshots', cloudBackupSnapshots),
      ]),
      mockProvider(StorageService),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef, {
        slideInClosed$: of(true),
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
    const slideInService = spectator.inject(IxSlideInService);

    const restoreButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'restore' }), 1, 1);
    await restoreButton.click();

    expect(slideInService.open).toHaveBeenCalledWith(CloudBackupRestoreFromSnapshotFormComponent, {
      data: {
        backup: { id: 1 } as CloudBackup,
        snapshot: cloudBackupSnapshots[0],
      },
    });
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', ''],
      ['UA', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
