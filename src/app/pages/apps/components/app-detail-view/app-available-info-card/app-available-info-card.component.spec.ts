import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { AppAvailableInfoCardComponent } from 'app/pages/apps/components/app-detail-view/app-available-info-card/app-available-info-card.component';

describe('AppAvailableInfoCardComponent', () => {
  let spectator: Spectator<AppAvailableInfoCardComponent>;

  const fakeApp = {
    catalog: 'OFFICIAL',
    train: 'charts',
    last_update: { $date: 1684134487000 },
    latest_version: '1.0.9',
    latest_app_version: '2023.5.3',
    sources: [
      'https://github.com/home-assistant/home-assistant',
      'https://github.com/truenas/charts/tree/master/library/ix-dev/charts/home-assistant',
    ],
    maintainers: [
      {
        name: 'truenas',
        url: 'https://www.truenas.com/',
        email: 'dev@ixsystems.com',
      },
    ],
  } as AvailableApp;

  const createComponent = createComponentFactory({
    component: AppAvailableInfoCardComponent,
    imports: [
      CleanLinkPipe,
      OrNotAvailablePipe,
      NgxSkeletonLoaderModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app: fakeApp,
        isLoading: false,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('h3')).toHaveText('Application Info');
  });

  it('shows card details', () => {
    expect(spectator.queryAll('.app-list-item')[0]).toHaveText('Version: 1.0.9');
    expect(spectator.queryAll('.app-list-item')[1]).toHaveText('Source:github.com/home-assistant/home-assistant');
    expect(spectator.queryAll('.app-list-item')[2]).toHaveText('Last App Update: 05/15/2023');

    const sources = spectator.query('.sources');
    expect(sources).toHaveText('Source:github.com/home-assistant/home-assistant');
    expect(sources).toHaveText('github.com/truenas/charts/tree/master/library/ix-dev/charts/home-assistant');
  });
});
