import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  createRoutingFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { JobItemComponent } from 'app/components/common/dialog/jobs-manager/components/job-item/job-item.component';
import { CoreComponents } from 'app/core/components/core-components.module';
import { byButton } from 'app/core/testing/utils/by-button.utils';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { ConfirmDialogComponent } from 'app/pages/common/confirm-dialog/confirm-dialog.component';
import { DialogService } from 'app/services';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { JobsManagerComponent } from './jobs-manager.component';
import { JobsManagerStore } from './jobs-manager.store';

describe('JobsManagerComponent', () => {
  let spectator: Spectator<JobsManagerComponent>;
  let matDialog: MatDialog;
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
  const waitingJob = {
    method: 'cloudsync.sync',
    state: JobState.Waiting,
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
        mockCall('core.get_jobs', [runningJob, waitingJob, failedJob]),
      ]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
      provideMockStore({
        selectors: [
          { selector: selectGeneralConfig, value: { timezone: 'UTC' } },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('checks component header is present', () => {
    expect(spectator.query('.jobs-header h3')).toHaveExactText('Task Manager');
    expect(spectator.query('.jobs-header span')).toHaveText('1 in progress, 1 in waiting, 1 failed');
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

    expect(matDialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      {
        disableClose: true,
      },
    );
  });

  xit('shows entity job dialog if user clicks on the job', () => {
    spectator.click(spectator.query('.job-clickable'));

    /*
      TODO: Find a way to mock componentInstance
      Error: Cannot read property 'componentInstance' of undefined
    */
    expect(matDialog.open).toHaveBeenCalledWith(
      EntityJobComponent,
      {
        data: {
          title: 'Updating',
        },
        hasBackdrop: true,
        width: '400px',
      },
    );
  });

  it('checks redirect when "History" button is pressed', () => {
    spectator.click(byButton('History'));
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/jobs']);
  });
});
