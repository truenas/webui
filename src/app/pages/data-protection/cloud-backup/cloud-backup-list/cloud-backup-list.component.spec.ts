/* eslint-disable sonarjs/no-skipped-test */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudBackupListComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.component';

describe('CloudBackupListComponent', () => {
  let spectator: Spectator<CloudBackupListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const cloudBackups = [
    {
      id: 1,
      description: 'UA',
      path: '/mnt/nmnmn',
      pre_script: 'your_pre_script',
      snapshot: false,
      enabled: false,
      job: {
        state: JobState.Finished,
        time_finished: {
          $date: new Date().getTime() - 50000,
        },
      },
    },
    {
      id: 2,
      description: 'UAH',
      path: '/mnt/hahah',
      pre_script: 'your_pre_script',
      snapshot: false,
      enabled: true,
      job: {
        state: JobState.Finished,
        time_finished: {
          $date: new Date().getTime() - 50000,
        },
      },
    },
  ] as CloudBackup[];

  const createComponent = createComponentFactory({
    component: CloudBackupListComponent,
    imports: [
      SearchInput1Component,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('cloud_backup.query', cloudBackups),
        mockCall('cloud_backup.delete'),
        mockCall('cloud_backup.update'),
        mockJob('cloud_backup.sync'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(EmptyService),
    ],
  });

  beforeEach(async () => {
    const dataProvider = new AsyncDataProvider<CloudBackup>(of(cloudBackups));
    spectator = createComponent({
      props: {
        dataProvider,
        cloudBackups,
        isMobileView: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Enabled', 'Snapshot', 'State', 'Last Run', ''],
      // ['UA', '', 'No', 'Finished', '50 seconds ago', ''],
      // ['UAH', '', 'No', 'Finished', '50 seconds ago', ''],
    ];
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  describe.skip('broken group', () => {
    it('shows form to edit an existing Cloud Backup when Edit button is pressed', async () => {
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
      await editButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        CloudBackupFormComponent,
        {
          wide: true,
          data: cloudBackups[0],
        },
      );
    });

    it('shows confirmation dialog when Run Now button is pressed', async () => {
      const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-play-circle' }), 1, 5);
      await runNowButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: 'Run Now',
        message: 'Run «UA» Cloud Backup now?',
        hideCheckbox: true,
      });

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.sync', [1]);
      expect(spectator.component.dataProvider().expandedRow).toEqual({ ...cloudBackups[0] });
    });

    it('deletes a Cloud Backup with confirmation when Delete button is pressed', async () => {
      const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
      await deleteIcon.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: 'Confirmation',
        message: 'Delete Cloud Backup <b>"UA"</b>?',
        buttonColor: 'warn',
        buttonText: 'Delete',
      });

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloud_backup.delete', [1]);
    });

    it('updates Cloud Backup Enabled status once mat-toggle is updated', async () => {
      const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 1);

      expect(await toggle.isChecked()).toBe(false);

      await toggle.check();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'cloud_backup.update',
        [1, { enabled: true }],
      );
    });
  });
});
