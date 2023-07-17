import { Spectator } from '@ngneat/spectator';
import { createHostFactory } from '@ngneat/spectator/jest';
import { CoreComponents } from 'app/core/core-components.module';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

describe('AppStatusCellComponent', () => {
  let spectator: Spectator<AppStatusCellComponent>;

  const createHost = createHostFactory({
    component: AppStatusCellComponent,
    imports: [CoreComponents],
  });

  function setupTest(
    appStatus: AppStatus,
    job?: Job<ChartScaleResult, ChartScaleQueryParams>,
    inProgress = true,
  ): void {
    spectator = createHost(`
      <ix-app-status-cell [appStatus]="appStatus" [job]="job" [inProgress]="inProgress"></ix-app-status-cell>
    `, {
      hostProps: { appStatus, job, inProgress },
    });
  }

  it('checks status for running app', () => {
    setupTest(AppStatus.Started);

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped app', () => {
    setupTest(AppStatus.Stopped);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying app', () => {
    setupTest(AppStatus.Deploying);

    expect(spectator.query('mat-spinner')).toBeTruthy();
    expect(spectator.query('span')).toHaveText('Deploying');
  });

  it('checks status for starting app', () => {
    setupTest(
      AppStatus.Starting,
      {
        arguments: ['fake-name', { replica_count: 1 }] as ChartScaleQueryParams,
        state: JobState.Running,
        result: undefined,
      } as Job<ChartScaleResult, ChartScaleQueryParams>,
    );

    expect(spectator.query('mat-spinner')).toBeTruthy();
    expect(spectator.query('span')).toHaveText('Starting');
  });

  it('checks status for stopping app', () => {
    setupTest(
      AppStatus.Stopping,
      {
        arguments: ['fake-name', { replica_count: 0 }] as ChartScaleQueryParams,
        state: JobState.Running,
        result: undefined,
      } as Job<ChartScaleResult, ChartScaleQueryParams>,
    );

    expect(spectator.query('mat-spinner')).toBeTruthy();
    expect(spectator.query('span')).toHaveText('Stopping');
  });
});
