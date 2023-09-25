import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { mockProvider, createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { JobsPanelPageObject } from 'app/modules/jobs/components/jobs-panel/jobs-panel.page-object';
import { JobEffects } from 'app/modules/jobs/store/job.effects';
import { jobReducer, adapter, jobsInitialState } from 'app/modules/jobs/store/job.reducer';
import { jobStateKey } from 'app/modules/jobs/store/job.selectors';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

const runningJob = {
  id: 1,
  method: 'cloudsync.sync',
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
  method: 'cloudsync.sync',
  state: JobState.Failed,
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
  let websocket: WebSocketService;
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
      }),
      mockWebsocket([
        mockCall('core.get_jobs', [runningJob, waitingJob, failedJob, transientRunningJob]),
        mockCall('core.job_abort'),
      ]),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    websocket = spectator.inject(WebSocketService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jobPanel = new JobsPanelPageObject(spectator);
  });

  it('loads jobs when adminUiInitialized is dispatched', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    expect(websocket.call).toHaveBeenCalledWith(
      'core.get_jobs',
      [[['state', '!=', JobState.Success]]],
    );
    expect(websocket.call).toHaveBeenCalledWith(
      'core.get_jobs',
      [[['state', '=', JobState.Success]], { limit: 30, order_by: ['-id'] }],
    );
  });

  it('checks component header is present', () => {
    expect(jobPanel.title).toHaveExactText('Jobs');
    expect(jobPanel.runningBadgeCount).toHaveText('1');
    expect(jobPanel.waitingBadgeCount).toHaveText('1');
    expect(jobPanel.failedBadgeCount).toHaveText('1');
  });

  it('checks component body is present', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    const jobs = jobPanel.getJobItemComponents;

    expect(jobs).toHaveLength(3);
    expect(jobs[0].job).toEqual(runningJob);
    expect(jobs[1].job).toEqual(waitingJob);
    expect(jobs[2].job).toEqual(failedJob);
    expect(jobs[4]).toBeUndefined();
  });

  it('shows confirm dialog if user clicks on the abort button', async () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    const abortButton = await loader.getHarness(MatButtonHarness.with({ selector: '.job-button-abort' }));
    await abortButton.click();

    expect(websocket.call).toHaveBeenCalledWith('core.job_abort', [1]);
  });

  it('checks redirect when "History" button is pressed', async () => {
    const historyButton = await loader.getHarness(MatButtonHarness.with({ text: 'History' }));
    await historyButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/jobs']);
  });
});
