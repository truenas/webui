import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { CleanLinkPipe } from 'app/core/pipes/clean-link.pipe';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppAvailableInfoCardComponent } from 'app/pages/apps/components/app-detail-view/app-available-info-card/app-available-info-card.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

describe('AppAvailableInfoCardComponent', () => {
  let spectator: Spectator<AppAvailableInfoCardComponent>;

  const isLoading$ = new BehaviorSubject(false);

  const fakeApp = {
    catalog: 'OFFICIAL',
    train: 'charts',
    last_update: { $date: 1684134487000 },
    latest_version: '1.0.9',
    latest_app_version: '2023.5.3',
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
    declarations: [
      CleanLinkPipe,
    ],
    providers: [
      mockProvider(ApplicationsService, {
        getCatalogItem: jest.fn(() => of({
          ...fakeApp,
          versions: {
            '1.0.9': {
              chart_metadata: {
                sources: [
                  'https://github.com/home-assistant/home-assistant',
                  'https://github.com/truenas/charts/tree/master/library/ix-dev/charts/home-assistant',
                ],
              },
            },
          },
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading$,
        app: fakeApp,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('h3')).toHaveText('Application Info');
  });

  it('shows card details', () => {
    expect(spectator.queryAll('.app-list-item')[0]).toHaveText('Version: 2023.5.3');
    expect(spectator.queryAll('.app-list-item')[1]).toHaveText('Source:github.com/home-assistant/home-assistant');
    expect(spectator.queryAll('.app-list-item')[2]).toHaveText('Last App Update: 05/15/2023');

    expect(spectator.component.sources).toStrictEqual([
      'https://github.com/home-assistant/home-assistant',
      'https://github.com/truenas/charts/tree/master/library/ix-dev/charts/home-assistant',
    ]);
  });
});
