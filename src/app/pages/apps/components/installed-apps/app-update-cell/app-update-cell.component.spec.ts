import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { App } from 'app/interfaces/app.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { AppVersionPipe } from 'app/pages/dashboard/widgets/apps/common/utils/app-version.pipe';

describe('AppUpdateCellComponent', () => {
  let spectator: SpectatorHost<AppUpdateCellComponent>;

  const createHost = createHostFactory({
    component: AppUpdateCellComponent,
    imports: [
      MapValuePipe,
      AppVersionPipe,
    ],
  });

  function setupTest(app: App): void {
    spectator = createHost(`
      <ix-app-update-cell [app]="app"></ix-app-update-cell>
    `, { hostProps: { app } });
  }

  it('shows up to date when app does not have upgrade available', () => {
    setupTest({ upgrade_available: false } as App);

    expect(spectator.query('span')).toHaveText('Up to date');
  });

  it('checks text when app has update', () => {
    setupTest({ upgrade_available: true } as App);

    expect(spectator.query('span')).toHaveText('Update available');
  });
});
