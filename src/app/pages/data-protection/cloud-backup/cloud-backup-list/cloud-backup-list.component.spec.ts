import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudBackupListComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

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
      BasicSearchComponent,
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
            value: [],
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    const dataProvider = new AsyncDataProvider<CloudBackup>(of(cloudBackups));
    dataProvider.load();
    spectator = createComponent({
      props: {
        dataProvider,
        cloudBackups,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
    spectator.detectChanges();
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Enabled', 'Snapshot', 'State', 'Last Run', ''],
      ['UA', '', 'No', 'FINISHED', '1 min. ago', ''],
      ['UAH', '', 'No', 'FINISHED', '1 min. ago', ''],
    ];
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Cloud Backup when Edit button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      {
        wide: true,
        data: cloudBackups[0],
      },
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Run job' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run «UA» Cloud Backup Task now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.sync', [1]);
  });

  it('shows success message when job completes successfully', async () => {
    jest.spyOn(spectator.inject(ApiService), 'job').mockReturnValue(of({
      id: 1,
      state: JobState.Success,
    } as Job<void>));

    const snackbarSpy = jest.spyOn(spectator.inject(SnackbarService), 'success');

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Run job' });

    // Wait for the observable to complete
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(snackbarSpy).toHaveBeenCalledWith(
      'Cloud Backup Task «UA» completed successfully.',
    );
  });

  it('shows success message when job finishes successfully', async () => {
    jest.spyOn(spectator.inject(ApiService), 'job').mockReturnValue(of({
      id: 1,
      state: JobState.Finished,
    } as Job<void>));

    const snackbarSpy = jest.spyOn(spectator.inject(SnackbarService), 'success');

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Run job' });

    // Wait for the observable to complete
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(snackbarSpy).toHaveBeenCalledWith(
      'Cloud Backup Task «UA» completed successfully.',
    );
  });

  it('deletes a Cloud Backup with confirmation when Delete button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Cloud Backup Task <b>"UA"</b>?',
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
