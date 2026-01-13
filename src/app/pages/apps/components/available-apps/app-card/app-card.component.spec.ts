import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { App } from 'app/interfaces/app.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('AppCardComponent', () => {
  let spectator: Spectator<AppCardComponent>;
  const createComponent = createComponentFactory({
    component: AppCardComponent,
    imports: [
      LazyLoadImageDirective,
      MockComponent(AppCardLogoComponent),
    ],
    providers: [
      mockProvider(InstalledAppsStore, {
        installedApps$: of([{}, {}, {}] as App[]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app: {
          name: 'SETI@home',
          icon_url: 'https://www.seti.org/logo.png',
          description: 'Use your computer to help SETI@home search for extraterrestrial intelligence.',
          latest_version: '1.0.0',
          latest_app_version: 'v2.1.0',
          train: 'stable',
          installed: true,
          popularity_rank: 99,
        } as AvailableApp,
      },
    });
  });

  it('shows app name', () => {
    expect(spectator.query('.name')).toContainText('SETI@home');
  });

  it('shows app popularity', () => {
    expect(spectator.query('.popularity-rank')).toContainText('99');
  });

  it('shows app logo', () => {
    expect(spectator.query(AppCardLogoComponent)!.url).toBe('https://www.seti.org/logo.png');
  });

  it('shows installed badge when [installed] is true', () => {
    expect(spectator.query('.installed-badge')).toExist();
  });

  it('shows app description', () => {
    const description = spectator.query('.description');
    expect(description).toHaveExactText('Use your computer to help SETI@home search for extraterrestrial intelligence.');
  });

  it('shows train name', () => {
    expect(spectator.query('.train')).toHaveText('stable');
  });

  it('shows app version and catalog version', () => {
    expect(spectator.query('.version')).toContainText('v2.1.0');
    expect(spectator.query('.catalog-version')).toHaveExactText('(1.0.0)');
  });

  it('shows N/A when version information is missing', () => {
    spectator.setInput({
      app: {
        name: 'TestApp',
        latest_version: null,
        latest_app_version: null,
      } as AvailableApp,
    });
    spectator.detectChanges();

    expect(spectator.query('.version')).toContainText('N/A');
    expect(spectator.query('.catalog-version')).toContainText('N/A');
  });
});
