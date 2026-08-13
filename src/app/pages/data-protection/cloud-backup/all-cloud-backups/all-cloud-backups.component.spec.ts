import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponents, MockDirective } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { JobState } from 'app/enums/job-state.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllCloudBackupsComponent } from 'app/pages/data-protection/cloud-backup/all-cloud-backups/all-cloud-backups.component';
import { CloudBackupDetailsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AllCloudBackupsComponent', () => {
  let spectator: Spectator<AllCloudBackupsComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const cloudBackups = [
    {
      id: 1,
      description: 'UA',
      path: '/mnt/nmnmn',
      snapshot: false,
      enabled: false,
      job: {
        state: JobState.Success,
        time_finished: {
          $date: new Date().getTime() - 50000,
        },
      },
    } as unknown as CloudBackup,
    {
      id: 2,
      description: 'UAH',
      path: '/mnt/hahah',
      snapshot: false,
      enabled: true,
      job: {
        state: JobState.Success,
        time_finished: {
          $date: new Date().getTime() - 50000,
        },
      },
    } as unknown as CloudBackup,
  ];

  const createComponent = createComponentFactory({
    component: AllCloudBackupsComponent,
    imports: [
      MockComponents(
        PageHeaderComponent,
        CloudBackupDetailsComponent,
      ),
      MockDirective(DetailsHeightDirective),
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
              state: JobState.Success,
              time_finished: {
                $date: new Date().getTime() - 50000,
              },
            }],
          },
          {
            selector: selectAdvancedConfig,
            value: {
              consolemenu: true,
              serialconsole: true,
              serialport: 'ttyS0',
              serialspeed: '9600',
              motd: 'Welcome back, commander',
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const [trigger] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  it('checks used components on page', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
  });

  it('shows form to create new Cloud Backup when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      {
        title: 'Add TrueCloud Backup Task',
        wide: true,
        inputs: { backupToEdit: undefined },
      },
    );
  });

  describe('cloud backup list', () => {
    it('should show table rows', async () => {
      expect(await table.getHeaderTexts()).toEqual(['Name', 'Enabled', 'Snapshot', 'State', 'Last Run', 'Actions']);
      expect(await table.getAllRowTexts()).toEqual([
        ['UA', '', 'No', 'Completed', '1 min. ago', ''],
        ['UAH', '', 'No', 'Completed', '1 min. ago', ''],
      ]);
    });

    // The rows are `[clickable]` and a row click selects the master-detail row, so the
    // actions cell has to swallow its own clicks — otherwise opening the row menu also
    // re-selects (or deselects) the row underneath it.
    it('does not change the selected row when the row action menu is opened', async () => {
      const selectedBefore = spectator.component.dataProvider.expandedRow;

      await openRowMenu();

      expect(spectator.component.dataProvider.expandedRow).toBe(selectedBefore);
    });

    it('sets the default sort for dataProvider', () => {
      spectator.component.dataProvider.load();

      expect(spectator.component.dataProvider.sorting).toEqual({
        active: 1,
        direction: SortDirection.Asc,
        propertyName: 'description',
      });
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
      expect(spectator.component.dataProvider.expandedRow).toEqual({ ...cloudBackups[0] });
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

    it('updates Cloud Backup Enabled status once the toggle is updated', async () => {
      const [toggle] = await loader.getAllHarnesses(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

      expect(await toggle.isChecked()).toBe(false);

      await toggle.check();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'cloud_backup.update',
        [1, { enabled: true }],
      );
    });
  });
});
