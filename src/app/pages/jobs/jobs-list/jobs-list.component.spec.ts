import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxEmptyRowHarness } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { jobsInitialState, JobsState } from 'app/modules/jobs/store/job.reducer';
import { selectJobs, selectJobState } from 'app/modules/jobs/store/job.selectors';
import { JobLogsRowComponent } from 'app/pages/jobs/job-logs-row/job-logs-row.component';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { JobsListComponent } from './jobs-list.component';

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
      EntityModule,
      IxTableModule,
      MatTabsModule,
    ],
    declarations: [
      JobLogsRowComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(DialogService),
      mockProvider(MatSnackBar),
      mockWebsocket([
        mockCall('core.download', [1, 'http://localhost/download/log']),
      ]),
      mockProvider(StorageService, {
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
    const cells = await table.getCells(true);
    const expectedRows = [
      ['Name', 'State', 'ID', 'Started', 'Finished', 'Logs', ''],
      ['cloudsync.sync', 'Failed', '446', '2022-05-28 10:00:01', '2022-05-28 10:00:01', 'Download Logs', ''],
      ['cloudsync.sync', 'Success', '445', '2022-05-28 10:00:01', '2022-05-28 10:00:01', '', ''],
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

  it('should download logs text file when click Download Logs button', async () => {
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const [downloadLogsButton] = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Download Logs' }));
    await downloadLogsButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', ['filesystem.get', ['/var/log/jobs/446.log'], '446.log']);
    expect(spectator.inject(StorageService).downloadUrl).toHaveBeenCalledWith('http://localhost/download/log', '446.log', 'text/plain');
  });
});
