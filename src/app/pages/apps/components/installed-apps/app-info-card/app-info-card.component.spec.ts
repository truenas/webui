import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';

describe('AppInfoCardComponent', () => {
  let spectator: Spectator<AppInfoCardComponent>;

  const app = {
    id: 'ix-test-app',
    update_available: true,
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppInfoCardComponent,
    declarations: [AppCardLogoComponent],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Info');
    expect(spectator.query('mat-card-header button')).toHaveText('Update');
  });
});
