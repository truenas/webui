import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppHelmChartCardComponent } from 'app/pages/apps/components/app-detail-view/app-helm-chart-card/app-helm-chart-card.component';
import { AppCatalogPipe } from 'app/pages/apps/utils/app-catalog.pipe';

describe('AppHelmChartCardComponent', () => {
  let spectator: Spectator<AppHelmChartCardComponent>;

  const fakeApp = {
    catalog: 'OFFICIAL',
    train: 'charts',
    latest_version: '1.0.91',
    maintainers: [
      {
        name: 'truenas',
        url: 'https://www.truenas.com/',
        email: 'dev@ixsystems.com',
      },
    ],
  } as AvailableApp;

  const isLoading$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: AppHelmChartCardComponent,
    imports: [AppCatalogPipe],
    declarations: [],
    providers: [],
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
    expect(spectator.query('h3')).toHaveText('Helm Chart Info');
  });

  it('shows card details', () => {
    expect(spectator.queryAll('.app-list-item')[0]).toHaveText('Catalog: Official');
    expect(spectator.queryAll('.app-list-item')[1]).toHaveText('Train: charts');
    expect(spectator.queryAll('.app-list-item')[2]).toHaveText('Chart Version: 1.0.91');
    expect(spectator.queryAll('.app-list-item')[3]).toHaveText('Maintainer: truenas (dev@ixsystems.com)');
  });
});
