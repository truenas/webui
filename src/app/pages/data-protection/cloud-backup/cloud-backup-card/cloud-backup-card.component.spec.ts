import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  CloudBackupCardComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-card/cloud-backup-card.component';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
    } as unknown as CloudBackup,
  ];

  const createComponent = createComponentFactory({
    component: CloudBackupCardComponent,
    imports: [
      AppLoaderModule,
      IxTableModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('cloud_backup.query', cloudBackups),
        mockCall('cloud_backup.delete'),
        mockCall('cloud_backup.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
      provideMockStore({
        selectors: [
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
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Cloud Backup when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(IxChainedSlideInService).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      true,
      cloudBackups[0],
    );
  });

  it('shows form to create new Cloud Backup when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxChainedSlideInService).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      true,
      undefined,
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'play_arrow' }), 1, 5);
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run «test one» Cloud Backup now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloud_backup.sync', [1]);
  });

  it('deletes a Cloud Backup with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Cloud Backup <b>"test one"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloud_backup.delete', [1]);
  });

  it('updates Cloud Backup Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 1);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'cloud_backup.update',
      [1, { enabled: true }],
    );
  });

  it('navigates to the details page when View Details button is pressed', async () => {
    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation();

    const viewDetailsIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'visibility' }), 1, 5);
    await viewDetailsIcon.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/data-protection', 'cloud-backup'], { fragment: '1' });
  });
});
