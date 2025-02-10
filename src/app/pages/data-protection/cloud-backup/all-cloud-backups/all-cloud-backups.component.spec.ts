import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents, MockDirective } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { JobState } from 'app/enums/job-state.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllCloudBackupsComponent } from 'app/pages/data-protection/cloud-backup/all-cloud-backups/all-cloud-backups.component';
import { CloudBackupDetailsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AllCloudBackupsComponent', () => {
  let spectator: Spectator<AllCloudBackupsComponent>;
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('checks used components on page', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
  });

  it('shows form to create new Cloud Backup when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      { wide: true },
    );
  });

  describe('cloud backup list', () => {
    it('should show table rows', async () => {
      const expectedRows = [
        ['Name', 'Enabled', 'Snapshot', 'State', 'Last Run', ''],
        ['UA', '', 'No', 'FINISHED', '1 min. ago', ''],
        ['UAH', '', 'No', 'FINISHED', '1 min. ago', ''],
      ];
      const cells = await table.getCellTexts();
      expect(cells).toEqual(expectedRows);
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
      expect(spectator.component.dataProvider.expandedRow).toEqual({ ...cloudBackups[0] });
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
