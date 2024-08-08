import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { App } from 'app/interfaces/app.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';

describe('AppUpdateCellComponent', () => {
  let spectator: SpectatorHost<AppUpdateCellComponent>;

  const createHost = createHostFactory({
    component: AppUpdateCellComponent,
    imports: [
      MapValuePipe,
    ],
  });

  function setupTest(app: App): void {
    spectator = createHost(`
      <ix-app-update-cell [app]="app"></ix-app-update-cell>
    `, { hostProps: { app } });
  }

  it('checks status for running app', () => {
    setupTest({ upgrade_available: false } as App);

    expect(spectator.query('span')).toHaveText('Up to date');
  });

  it('checks text when app has update', () => {
    setupTest({ upgrade_available: true } as App);

    expect(spectator.query('span')).toHaveText('Update available');
  });
});
