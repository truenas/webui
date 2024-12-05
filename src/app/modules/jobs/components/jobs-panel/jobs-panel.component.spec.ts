import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { byText } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { JobsPanelPageObject } from 'app/modules/jobs/components/jobs-panel/jobs-panel.page-object';
import { JobEffects } from 'app/modules/jobs/store/job.effects';
import { jobReducer, adapter, jobsInitialState } from 'app/modules/jobs/store/job.reducer';
import { jobStateKey } from 'app/modules/jobs/store/job.selectors';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

const runningJob = {
  id: 1,
  method: 'pool.scrub',
  progress: {
    percent: 99,
    description: 'progress description',
  },
  state: JobState.Running,
  abortable: true,
  time_started: {
    $date: 1632411439081,
  },
} as Job;
const waitingJob = {
  id: 2,
  method: 'cloudsync.sync',
  state: JobState.Waiting,
  time_started: {
    $date: 1632411439081,
  },
} as Job;
const failedJob = {
  id: 3,
  method: 'replication.run',
  state: JobState.Failed,
  error: 'Some error',
  time_started: {
    $date: 1632411439081,
  },
  time_finished: {
    $date: 1632411439082,
  },
} as Job;
const transientRunningJob = {
  id: 4,
  method: 'cloudsync.sync',
  progress: {
    percent: 99,
    description: 'transient progress description',
  },
  state: JobState.Running,
  abortable: true,
  time_started: {
    $date: 1632411439081,
  },
  transient: true,
} as Job;

describe('JobsPanelComponent', () => {
  let spectator: Spectator<JobsPanelComponent>;
  let api: ApiService;
  let loader: HarnessLoader;
  let jobPanel: JobsPanelPageObject;

  const createComponent = createRoutingFactory({
    component: JobsPanelComponent,
    imports: [
      StoreModule.forRoot({ [jobStateKey]: jobReducer }, {
        initialState: {
          [jobStateKey]: adapter.setAll([runningJob, waitingJob, failedJob], jobsInitialState),
        },
      }),
      EffectsModule.forRoot([JobEffects]),
    ],
    declarations: [
      JobItemComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockApi([
        mockCall('core.get_jobs', (query) => {
          if (query[0][0][2] === JobState.Success) {
            return [];
          }
          return [runningJob, waitingJob, failedJob, transientRunningJob];
        }),
        mockCall('core.job_abort'),
      ]),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jobPanel = new JobsPanelPageObject(spectator);
  });

  it('loads jobs when adminUiInitialized is dispatched', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    expect(api.call).toHaveBeenCalledWith(
      'core.get_jobs',
      [[['state', '!=', JobState.Success]]],
    );
    expect(api.call).toHaveBeenCalledWith(
      'core.get_jobs',
      [[['state', '=', JobState.Success]], { limit: 30, order_by: ['-id'] }],
    );
  });

  it('checks component header is present', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    expect(jobPanel.title).toHaveExactText('Running Jobs');
    expect(jobPanel.runningBadgeCount).toHaveText('1');
    expect(jobPanel.waitingBadgeCount).toHaveText('1');
    expect(jobPanel.failedBadgeCount).toHaveText('1');
  });

  it('checks component body is present', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    const jobs = jobPanel.getJobItemComponents;

    expect(jobs).toHaveLength(3);
    expect(jobs[0].job()).toEqual(runningJob);
    expect(jobs[1].job()).toEqual(waitingJob);
    expect(jobs[2].job()).toEqual(failedJob);
    expect(jobs[4]).toBeUndefined();
  });

  it('aborts a job when abort button is pressed', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    const abortButton = spectator.query('.job-button-abort');
    spectator.click(abortButton);

    expect(api.call).toHaveBeenCalledWith('core.job_abort', [1]);
  });

  it('checks redirect when "History" button is pressed', async () => {
    const historyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Go to Jobs Page' }));
    await historyButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/jobs']);
  });

  it('shows an error report when user clicks on a failed job', () => {
    spectator.click(byText('replication.run'));

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(failedJob);
  });

  it('shows a job in progress dialog when user clicks on an active job', () => {
    spectator.click(byText('pool.scrub'));

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
  });
});
