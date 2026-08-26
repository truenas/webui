import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCardComponent, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { CloudBackupSnapshotsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-snapshots/cloud-backup-snapshots.component';
import { StorageService } from 'app/services/storage.service';
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
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: CloudBackupSnapshotsComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('cloud_backup.list_snapshots', cloudBackupSnapshots),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(StorageService),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
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
    table = await loader.getHarness(TnTableHarness);
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const [trigger] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  it('checks page title', () => {
    // Read the tn-card input rather than its internal <h3>, which is library markup.
    expect(spectator.query(TnCardComponent)!.title()).toBe('Snapshots');
  });

  it('handles restore functionality', async () => {
    const formPanel = spectator.inject(FormSidePanelService);

    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Restore' });

    expect(formPanel.open).toHaveBeenCalledWith(CloudBackupRestoreFromSnapshotFormComponent, {
      title: 'Restore from Snapshot',
      inputs: {
        restoreData: {
          backup: { id: 1 } as CloudBackup,
          snapshot: cloudBackupSnapshots[1],
        },
      },
    });
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Snapshot Time', 'Hostname', 'Actions']);
    expect(await table.getAllRowTexts()).toEqual([
      ['1 min. ago', 'recent', ''],
      ['8 min. ago', 'older', ''],
    ]);
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.delete_snapshot', [1, 'second']);
  });
});
