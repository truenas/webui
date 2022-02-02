import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator, createRoutingFactory, mockProvider } from '@ngneat/spectator';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/components/core-components.module';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { JobEffects } from 'app/modules/jobs/store/job.effects';
import { adapter, jobReducer, jobsInitialState } from 'app/modules/jobs/store/job.reducer';
import { jobStateKey } from 'app/modules/jobs/store/job.selectors';
import { DialogService, WebSocketService } from 'app/services';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

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

describe('JobsPanelComponent', () => {
  let spectator: Spectator<JobsPanelComponent>;
  let websocket: WebSocketService;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: JobsPanelComponent,
    imports: [
      EntityModule,
      CoreComponents,
      StoreModule.forRoot({ [jobStateKey]: jobReducer }, {
        initialState: {
          [jobStateKey]: adapter.setAll([runningJob, waitingJob, failedJob], jobsInitialState),
        },
      }),
      EffectsModule.forRoot([JobEffects]),
    ],
    declarations: [
      JobItemComponent,
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebsocket([
        mockCall('core.get_jobs', [runningJob, waitingJob, failedJob]),
        mockCall('core.job_abort'),
      ]),
      mockProvider(MatDialogRef),
      provideMockStore({
        selectors: [
          { selector: selectGeneralConfig, value: { timezone: 'UTC' } },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    websocket = spectator.inject(WebSocketService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.inject(Store).dispatch(adminUiInitialized());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('checks component header is present', () => {
    expect(spectator.query('.jobs-header h3')).toHaveExactText('Task Manager');
    expect(spectator.query('.job-badge.running .job-badge-count')).toHaveText('1');
    expect(spectator.query('.job-badge.waiting .job-badge-count')).toHaveText('1');
    expect(spectator.query('.job-badge.failed .job-badge-count')).toHaveText('1');
  });

  it('checks component footer is present', () => {
    expect(spectator.query('mat-dialog-actions button')).toHaveExactText('History');
  });

  it('checks component body is present', () => {
    const jobs = spectator.queryAll('app-job-item');

    expect(jobs).toHaveLength(3);

    expect(jobs[0].querySelector('.job-description')).toHaveExactText('cloudsync.sync');
    expect(jobs[0].querySelector('.job-progress-description')).toHaveText('progress description');
    expect(jobs[0].querySelector('.job-icon-failed')).toBeFalsy();
    expect(jobs[0].querySelector('.job-icon-waiting')).toBeFalsy();
    expect(jobs[0].querySelector('.job-icon-abort')).toBeTruthy();

    expect(jobs[1].querySelector('.job-description')).toHaveExactText('cloudsync.sync');
    expect(jobs[1].querySelector('.job-time')).toHaveText('Waiting: 2021-09-23 15:37:19');
    expect(jobs[1].querySelector('.job-icon-failed')).toBeFalsy();
    expect(jobs[1].querySelector('.job-icon-waiting')).toBeTruthy();
    expect(jobs[1].querySelector('.job-icon-abort')).toBeFalsy();

    expect(jobs[2].querySelector('.job-description')).toHaveExactText('cloudsync.sync');
    expect(jobs[2].querySelector('.job-time')).toHaveText('Stopped: 2021-09-23 15:37:19');
    expect(jobs[2].querySelector('.job-icon-failed')).toBeTruthy();
    expect(jobs[2].querySelector('.job-icon-waiting')).toBeFalsy();
    expect(jobs[2].querySelector('.job-icon-abort')).toBeFalsy();
  });

  it('shows confirm dialog if user clicks on the abort button', () => {
    spectator.click(spectator.query('.job-button-abort'));

    expect(websocket.call).toHaveBeenCalledWith('core.job_abort', [1]);
  });

  it('checks redirect when "History" button is pressed', async () => {
    const historyButton = await loader.getHarness(MatButtonHarness.with({ text: 'History' }));
    await historyButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/jobs']);
  });
});
