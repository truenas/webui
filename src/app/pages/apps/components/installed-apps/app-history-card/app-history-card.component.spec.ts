import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppHistoryCardComponent } from 'app/pages/apps/components/installed-apps/app-history-card/app-history-card.component';

describe('AppHistoryCardComponent', () => {
  let spectator: Spectator<AppHistoryCardComponent>;

  const app = {
    id: 'ix-test-app',
    update_available: true,
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppHistoryCardComponent,
    declarations: [],
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
    expect(spectator.query('mat-card-header h3')).toHaveText('History');
  });
});
