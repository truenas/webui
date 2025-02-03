import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { delay, of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CloudBackupCardComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-card/cloud-backup-card.component';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('CloudBackupCardComponent', () => {
  let spectator: Spectator<CloudBackupCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const cloudBackups = [
    {
      id: 1,
      description: 'test one',
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
    } as CloudBackup,
    {
      id: 2,
      description: 'test two',
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
    } as CloudBackup,
  ];

  const createComponent = createComponentFactory({
    component: CloudBackupCardComponent,
    imports: [
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('cloud_backup.query', cloudBackups),
        mockCall('cloud_backup.delete'),
        mockCall('cloud_backup.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectPreferences,
            value: {},
          },
          {
            selector: selectJobs,
            value: [{
              state: JobState.Finished,
              time_finished: {
                $date: new Date().getTime() - 50000,
              },
            }],
          },
        ],
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
      ['Name', 'Enabled', 'Snapshot', 'State', 'Last Run', ''],
      ['test one', '', 'No', 'FINISHED', '1 min. ago', ''],
      ['test two', '', 'No', 'FINISHED', '1 min. ago', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

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

  it('shows form to create new Cloud Backup when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      { wide: true },
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-play-circle' }), 1, 5);
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run «test one» Cloud Backup now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.sync', [1]);
  });

  it('deletes a Cloud Backup with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Cloud Backup <b>"test one"</b>?',
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

  it('sends only one update request when multiple mat-toggle is updated', async () => {
    jest.spyOn(spectator.component.dataProvider, 'load').mockImplementation();
    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementationOnce((method) => {
      if (method === 'cloud_backup.update') {
        return of(null).pipe(delay(10));
      }
      throw new Error(`Unexpected method: ${method}`);
    });

    const toggle1 = await table.getHarnessInCell(MatSlideToggleHarness, 1, 1);
    const toggle2 = await table.getHarnessInCell(MatSlideToggleHarness, 2, 1);

    expect(spectator.component.dataProvider.load).toHaveBeenCalledTimes(0);
    await Promise.all([toggle1.check(), toggle2.check()]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'cloud_backup.update',
      [1, { enabled: true }],
    );

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'cloud_backup.update',
      [2, { enabled: true }],
    );
    expect(spectator.component.dataProvider.load).toHaveBeenCalledTimes(1);
  });

  it('shows cloud backup update error', async () => {
    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementationOnce((method) => {
      if (method === 'cloud_backup.update') {
        return throwError(() => ({
          jsonrpc: '2.0',
          error: {
            data: {
              reason: 'cloud backup update error',
            },
          },
        }));
      }
      throw new Error(`Unexpected method: ${method}`);
    });

    expect(spectator.inject(DialogService).error).not.toHaveBeenCalled();
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 1);
    await toggle.check();
    expect(spectator.inject(DialogService).error).toHaveBeenCalled();
  });

  it('navigates to the details page when View Details button is pressed', async () => {
    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation();

    const viewDetailsIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'visibility' }), 1, 5);
    await viewDetailsIcon.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/data-protection', 'cloud-backup'], { fragment: '1' });
  });
});
