import { Spectator } from '@ngneat/spectator';
import { createHostFactory } from '@ngneat/spectator/jest';
import { CoreComponents } from 'app/core/core-components.module';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';

describe('AppStatusCellComponent', () => {
  let spectator: Spectator<AppStatusCellComponent>;

  const createHost = createHostFactory({
    component: AppStatusCellComponent,
    imports: [CoreComponents],
  });

  function setupTest(app: ChartRelease, job?: Job<ChartScaleResult, ChartScaleQueryParams>): void {
    spectator = createHost('<ix-app-status-cell [app]="app" [job]="job"></ix-app-status-cell>', {
      hostProps: { app, job },
    });
  }

  it('checks status for running app', () => {
    setupTest({ status: ChartReleaseStatus.Active } as ChartRelease);

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped app', () => {
    setupTest({ status: ChartReleaseStatus.Stopped } as ChartRelease);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying app', () => {
    setupTest({ status: ChartReleaseStatus.Deploying } as ChartRelease);

    expect(spectator.query('mat-spinner')).toBeTruthy();
    expect(spectator.query('span')).toHaveText('Deploying');
  });

  it('checks status for starting app', () => {
    setupTest(
      { status: ChartReleaseStatus.Stopped } as ChartRelease,
      {
        arguments: ['fake-name', { replica_count: 1 }],
        state: JobState.Running,
        result: [],
      } as unknown as Job<ChartScaleResult, ChartScaleQueryParams>,
    );

    expect(spectator.query('mat-spinner')).toBeTruthy();
    expect(spectator.query('span')).toHaveText('Starting');
  });

  it('checks status for stopping app', () => {
    setupTest(
      { status: ChartReleaseStatus.Active } as ChartRelease,
      {
        arguments: ['fake-name', { replica_count: 0 }],
        state: JobState.Running,
        result: [],
      } as unknown as Job<ChartScaleResult, ChartScaleQueryParams>,
    );

    expect(spectator.query('mat-spinner')).toBeTruthy();
    expect(spectator.query('span')).toHaveText('Stopping');
  });
});
