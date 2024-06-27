import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { Job } from 'app/interfaces/job.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

describe('AppStatusCellComponent', () => {
  let spectator: SpectatorHost<AppStatusCellComponent>;

  const createHost = createHostFactory({
    component: AppStatusCellComponent,
    imports: [
      MapValuePipe,
    ],
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

    expect(spectator.query('span')).toHaveText('Stopping');
  });
});
