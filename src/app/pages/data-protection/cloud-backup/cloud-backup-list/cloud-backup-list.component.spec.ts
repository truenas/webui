import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
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
  let table: TnTableHarness;

  const cloudBackups = [
    {
      id: 1,
      description: 'UA',
      path: '/mnt/nmnmn',
      pre_script: 'your_pre_script',
      snapshot: false,
      enabled: false,
      job: {
        state: JobState.Success,
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
        state: JobState.Success,
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
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(SnackbarService),
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
    table = await loader.getHarness(TnTableHarness);
    spectator.detectChanges();
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const [trigger] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Enabled', 'Snapshot', 'State', 'Last Run', 'Actions']);
    expect(await table.getAllRowTexts()).toEqual([
      ['UA', '', 'No', 'Completed', '1 min. ago', ''],
      ['UAH', '', 'No', 'Completed', '1 min. ago', ''],
    ]);
  });

  it('shows form to edit an existing Cloud Backup when Edit button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      {
        title: 'Edit TrueCloud Backup Task',
        wide: true,
        inputs: { backupToEdit: cloudBackups[0] },
      },
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Run job' });

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

    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Run job' });

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
      state: JobState.Success,
    } as Job<void>));

    const snackbarSpy = jest.spyOn(spectator.inject(SnackbarService), 'success');

    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Run job' });

    // Wait for the observable to complete
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(snackbarSpy).toHaveBeenCalledWith(
      'Cloud Backup Task «UA» completed successfully.',
    );
  });

  it('deletes a Cloud Backup with confirmation when Delete button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Cloud Backup Task <b>"UA"</b>?',
      call: expect.any(Function),
      successMessage: 'Cloud Backup Task «UA» deleted.',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloud_backup.delete', [1]);
  });

  it('sorts through the data provider when a sortable header is clicked', async () => {
    const dataProvider = spectator.component.dataProvider();
    jest.spyOn(dataProvider, 'setSorting');

    expect(await table.isSortable('description')).toBe(true);
    expect(await table.isSortable('enabled')).toBe(true);
    expect(await table.isSortable('snapshot')).toBe(true);

    await table.clickSortHeader('description');

    expect(dataProvider.setSorting).toHaveBeenCalledWith({
      propertyName: 'description',
      direction: SortDirection.Asc,
      active: 0,
    });
    expect(await table.getSortDirection('description')).toBe('ascending');
  });

  it('updates Cloud Backup Enabled status once the toggle is updated', async () => {
    const [toggle] = await loader.getAllHarnesses(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'cloud_backup.update',
      [1, { enabled: true }],
    );
  });

  // `[activeRow]` matches by object identity and `expandedRow` may hold a copy, so the
  // component resolves it back to the rendered reference — as a computed, which has to
  // stay in step with writes made by this component *and* by its parent.
  describe('active row', () => {
    it('marks the clicked row active', async () => {
      expect(await table.getActiveRowIndex()).toBeNull();

      await table.clickRow(1);
      spectator.detectChanges();

      expect(await table.getActiveRowIndex()).toBe(1);
    });

    it('follows a row the parent expands, including a structurally-equal copy', async () => {
      spectator.component.dataProvider().expandedRow = { ...cloudBackups[0] };
      spectator.detectChanges();

      expect(await table.getActiveRowIndex()).toBe(0);
    });

    it('clears the active row when the expansion is cleared', async () => {
      await table.clickRow(0);
      spectator.detectChanges();
      expect(await table.getActiveRowIndex()).toBe(0);

      spectator.component.dataProvider().expandedRow = null;
      spectator.detectChanges();

      expect(await table.getActiveRowIndex()).toBeNull();
    });
  });
});
