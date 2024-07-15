import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';

describe('AppStatusCellComponent', () => {
  let spectator: SpectatorHost<AppStatusCellComponent>;

  const createHost = createHostFactory({
    component: AppStatusCellComponent,
    imports: [
      MapValuePipe,
    ],
  });

  function setupTest(
    app: ChartRelease,
    job?: Job<ChartScaleResult, ChartScaleQueryParams>,
  ): void {
    spectator = createHost(`
      <ix-app-status-cell [app]="app" [job]="job"></ix-app-status-cell>
    `, { hostProps: { app, job } });
  }

  it('checks status for running app', () => {
    setupTest({ status: ChartReleaseStatus.Active } as unknown as ChartRelease);

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped app', () => {
    setupTest({ status: ChartReleaseStatus.Stopped } as unknown as ChartRelease);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying app', () => {
    setupTest({ status: ChartReleaseStatus.Deploying } as unknown as ChartRelease);

    expect(spectator.query('span')).toHaveText('Deploying');
  });

  it('checks status for starting app', () => {
    setupTest(
      { status: ChartReleaseStatus.Stopped } as unknown as ChartRelease,
      {
        arguments: ['fake-name', { replica_count: 1 }] as ChartScaleQueryParams,
        state: JobState.Running,
      } as Job<ChartScaleResult, ChartScaleQueryParams>,
    );

    expect(spectator.query('span')).toHaveText('Starting');
  });

  it('checks status for stopping app', () => {
    setupTest(
      { status: ChartReleaseStatus.Active } as unknown as ChartRelease,
      {
        arguments: ['fake-name', { replica_count: 0 }] as ChartScaleQueryParams,
        state: JobState.Running,
      } as Job<ChartScaleResult, ChartScaleQueryParams>,
    );

    expect(spectator.query('span')).toHaveText('Stopping');
  });
});
