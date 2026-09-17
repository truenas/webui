import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { TnTooltipDirective } from '@truenas/ui-components';
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

  function setupTest(app: App, showIcon = false): void {
    spectator = createHost(`
      <ix-app-update-cell [app]="app" [showIcon]="showIcon"></ix-app-update-cell>
    `, { hostProps: { app, showIcon } });
  }

  function getTooltipMessage(): string {
    const tooltip = spectator.query(TnTooltipDirective, { read: TnTooltipDirective });
    return String(tooltip?.message());
  }

  it('shows up to date when app does not have update available', () => {
    setupTest({ upgrade_available: false } as App);

    expect(spectator.query('span')).toHaveText('Up to date');
  });

  it('shows "Update available" when app version has changed', () => {
    setupTest({
      upgrade_available: true,
      version: '1.0.0',
      latest_version: '1.0.1',
      latest_app_version: '8.7.1',
      metadata: { app_version: '8.7.0' },
      human_version: '8.7.0_1.0.0',
    } as App);

    expect(spectator.query('span')).toHaveText('Update available');
  });

  it('shows "Revision available" when only revision has changed', () => {
    setupTest({
      upgrade_available: true,
      version: '1.0.0',
      latest_version: '1.0.1',
      latest_app_version: '8.7.0',
      metadata: { app_version: '8.7.0' },
      human_version: '8.7.0_1.0.0',
    } as App);

    expect(spectator.query('span')).toHaveText('Revision available');
  });

  it('shows versions the update will move to in the icon tooltip', () => {
    setupTest({
      upgrade_available: true,
      version: '1.9.52',
      latest_version: '1.9.54',
      latest_app_version: 'version-6.7.1',
      metadata: { app_version: 'version-6.6.6' },
      human_version: 'version-6.6.6_1.9.52',
    } as App, true);

    expect(getTooltipMessage()).toBe(
      'Update available\nVersion: version-6.6.6 → version-6.7.1\nRevision: 1.9.52 → 1.9.54',
    );
  });

  it('omits the app version row from the tooltip when only revision changes', () => {
    setupTest({
      upgrade_available: true,
      version: '1.9.52',
      latest_version: '1.9.54',
      latest_app_version: 'version-6.6.6',
      metadata: { app_version: 'version-6.6.6' },
      human_version: 'version-6.6.6_1.9.52',
    } as App, true);

    expect(getTooltipMessage()).toBe('Revision available\nRevision: 1.9.52 → 1.9.54');
  });
});
