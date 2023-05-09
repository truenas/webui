import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppContainersCardComponent } from 'app/pages/apps/components/installed-apps/app-containers-card/app-containers-card.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppHistoryCardComponent } from 'app/pages/apps/components/installed-apps/app-history-card/app-history-card.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppNotesCardComponent } from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-card.component';

describe('AppDetailsPanelComponent', () => {
  let spectator: Spectator<AppDetailsPanelComponent>;

  const app = {
    id: 'ix-test-app',
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppDetailsPanelComponent,
    declarations: [
      MockComponents(
        AppInfoCardComponent,
        AppContainersCardComponent,
        AppHistoryCardComponent,
        AppNotesCardComponent,
      ),
    ],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
  });

  it('shows a title', () => {
    expect(spectator.query('h2')).toHaveText('Details');
  });
});
