import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { AppState } from 'app/enums/app-state.enum';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';

describe('AppStateCellComponent', () => {
  let spectator: SpectatorHost<AppStateCellComponent>;

  const createHost = createHostFactory({
    component: AppStateCellComponent,
    imports: [
      MapValuePipe,
    ],
  });

  function setupTest(
    app: App,
    job?: Job<unknown, AppStartQueryParams>,
  ): void {
    spectator = createHost(`
      <ix-app-state-cell [app]="app" [job]="job"></ix-app-state-cell>
    `, { hostProps: { app, job } });
  }

  it('checks state for running app', () => {
    setupTest({ state: AppState.Running } as App);

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks state for stopped app', () => {
    setupTest({ state: AppState.Stopped } as App);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks state for deploying app', () => {
    setupTest({ state: AppState.Deploying } as App);

    expect(spectator.query('span')).toHaveText('Deploying');
  });

  it('checks state for stopping app', () => {
    setupTest(
      { state: AppState.Stopping } as App,
    );

    expect(spectator.query('span')).toHaveText('Stopping');
  });
});
