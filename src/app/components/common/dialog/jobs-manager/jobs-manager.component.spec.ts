import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  createRoutingFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { JobItemComponent } from 'app/components/common/dialog/jobs-manager/components/job-item/job-item.component';
import { CoreComponents } from 'app/core/components/core-components.module';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { DialogService } from 'app/services';
import { JobsManagerComponent } from './jobs-manager.component';
import { JobsManagerStore } from './jobs-manager.store';

describe('JobsManagerComponent', () => {
  let spectator: Spectator<JobsManagerComponent>;
  const runningJob = {
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
  const failedJob = {
    method: 'cloudsync.sync',
    state: JobState.Failed,
    time_finished: {
      $date: 1632411439082,
    },
  } as Job;

  const createComponent = createRoutingFactory({
    component: JobsManagerComponent,
    imports: [
      EntityModule,
      CoreComponents,
    ],
    declarations: [
      JobItemComponent,
    ],
    providers: [
      JobsManagerStore,
      DialogService,
      mockWebsocket([
        mockCall('core.get_jobs', [runningJob, failedJob]),
      ]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks component header is present', () => {
    expect(spectator.query('.jobs-header h3')).toHaveExactText('Running Jobs');
    expect(spectator.query('.jobs-header span')).toHaveExactText(' 1 in progress, 1 failed ');
  });

  it('checks component footer is present', () => {
    expect(spectator.query('mat-dialog-actions button')).toHaveExactText('History');
  });

  it('checks component body is present', () => {
    const jobs = spectator.queryAll('app-job-item');
    expect(jobs).toHaveLength(2);

    expect(jobs[0].querySelector('.job-description')).toHaveExactText('cloudsync.sync');
    expect(jobs[0].querySelector('.job-icon-failed')).toBeFalsy();
    expect(jobs[0].querySelector('.job-icon-abort')).toBeTruthy();
    expect(jobs[0].querySelector('.job-progress-description')).toHaveText('progress description');

    expect(jobs[1].querySelector('.job-description')).toHaveExactText('cloudsync.sync');
    expect(jobs[1].querySelector('.job-icon-failed')).toBeTruthy();
    expect(jobs[1].querySelector('.job-icon-abort')).toBeFalsy();
    expect(jobs[1].querySelector('.job-time')).toHaveText('Stopped:');
  });
});
