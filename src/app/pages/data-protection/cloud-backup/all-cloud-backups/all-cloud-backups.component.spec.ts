import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent, MockComponents, MockDirective } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { JobState } from 'app/enums/job-state.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { AllCloudBackupsComponent } from 'app/pages/data-protection/cloud-backup/all-cloud-backups/all-cloud-backups.component';
import { CloudBackupDetailsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudBackupListComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AllCloudBackupsComponent', () => {
  let spectator: Spectator<AllCloudBackupsComponent>;
  let loader: HarnessLoader;

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
    } as CloudBackup,
  ];

  const createComponent = createComponentFactory({
    component: AllCloudBackupsComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      MockComponents(
        CloudBackupListComponent,
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

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks used components on page', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
    expect(spectator.query(SearchInput1Component)).toExist();
  });

  it('shows form to create new Cloud Backup when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      { wide: true },
    );
  });

  it('sets the default sort for dataProvider', () => {
    spectator.component.dataProvider.load();

    expect(spectator.component.dataProvider.setSorting).toHaveBeenCalledWith({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'description',
    });
  });
});
