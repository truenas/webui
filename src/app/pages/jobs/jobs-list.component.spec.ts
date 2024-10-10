import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxEmptyRowHarness } from 'app/modules/ix-table/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { jobsInitialState, JobsState } from 'app/modules/jobs/store/job.reducer';
import { selectJobs, selectJobState } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { JobLogsRowComponent } from 'app/pages/jobs/job-logs-row/job-logs-row.component';
import { JobNameComponent } from 'app/pages/jobs/job-name/job-name.component';
import { JobsListComponent } from 'app/pages/jobs/jobs-list.component';
import { DownloadService } from 'app/services/download.service';
import { LocaleService } from 'app/services/locale.service';

const fakeJobDataSource: Job[] = [{
  abortable: true,
  arguments: [1],
  description: null,
  id: 446,
  logs_excerpt: "<3>ERROR : webdav root '': error reading source root directory: couldn't list files",
  logs_path: '/var/log/jobs/446.log',
  method: 'cloudsync.sync',
  progress: {
    description: 'Starting',
    extra: null,
    percent: 0,
  },
  result: null,
  state: JobState.Failed,
  time_finished: { $date: 1653721201697 },
  time_started: { $date: 1653721201446 },
}, {
  abortable: true,
  arguments: [2],
  description: null,
  id: 445,
  logs_path: '/var/log/jobs/445.log',
  method: 'cloudsync.sync',
  progress: {
    description: 'Starting',
    extra: null,
    percent: 100,
  },
  result: null,
  state: JobState.Success,
  time_finished: { $date: 1653721201899 },
  time_started: { $date: 1653721201440 },
}] as Job[];

describe('JobsListComponent', () => {
  let spectator: Spectator<JobsListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<JobsState>;

  const createComponent = createComponentFactory({
    component: JobsListComponent,
    imports: [
      MatTabsModule,
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      MatButtonToggleGroup,
      MatButtonToggle,
      CopyButtonComponent,
      IxTableCellDirective,
      IxTableDetailsRowDirective,
    ],
    declarations: [
      JobNameComponent,
      JobLogsRowComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'Europe/Kiev',
      }),
      mockProvider(DialogService),
      mockProvider(MatSnackBar),
      mockWebSocket([
        mockCall('core.job_download_logs', 'http://localhost/download/log'),
      ]),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(() => of(undefined)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectJobState,
            value: jobsInitialState,
          },
          {
            selector: selectJobs,
            value: [],
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  });

  it('should show table rows', async () => {
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCellTexts();
    const expectedRows = [
      ['Name', 'State', 'ID', 'Started', 'Finished'],
      ['cloudsync.sync', 'FAILED', '446', '2022-05-28 10:00:01', '2022-05-28 10:00:01'],
      ['cloudsync.sync', 'SUCCESS', '445', '2022-05-28 10:00:01', '2022-05-28 10:00:01'],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    store$.overrideSelector(selectJobs, []);
    store$.refreshState();

    spectator.detectChanges();
    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('No records have been added yet');
  });

  it('should expand only one row on click', async () => {
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const [firstExpandButton, secondExpandButton] = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[ixTest="toggle-row"]' }));
    await firstExpandButton.click();
    await secondExpandButton.click();

    expect(spectator.queryAll('.expanded')).toHaveLength(1);
  });
});
