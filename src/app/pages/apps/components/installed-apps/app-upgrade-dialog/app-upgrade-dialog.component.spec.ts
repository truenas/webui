import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';

describe('AppUpgradeDialogComponent - test 1', () => {
  let spectator: Spectator<AppUpgradeDialogComponent>;
  const createComponent = createComponentFactory({
    component: AppUpgradeDialogComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows title as application name', () => {
    spectator.detectChanges();
    expect(spectator.query('.chart-name').textContent).toBe('elastic-search');
    expect(1).toBe(1);
  });

  it('shows current application version', () => {
    expect(spectator.query('.version').textContent).toBe(' 8.7.0_1.0.1');
    expect(2).toBe(2);
  });
});
