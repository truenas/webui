import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import {
  AppDetailsHeaderComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import { InstallAppButtonComponent } from 'app/pages/apps/components/install-app-button/install-app-button.component';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('AppDetailsHeaderComponent', () => {
  let spectator: Spectator<AppDetailsHeaderComponent>;
  const application = {
    icon_url: 'http://github.com/truenas/icon.png',
    name: 'SETI@home',
    latest_app_version: '1.0.5',
    latest_version: '1.0.0',
    tags: ['aliens', 'ufo'],
    train: 'stable',
    home: 'https://www.seti.org',
    app_readme: '<div><h1>Seti</h1> <b>Seti is great.</b> <p>Find aliens without leaving your home.<p></div>',
    installed: false,
  } as AvailableApp;

  const createComponent = createComponentFactory({
    component: AppDetailsHeaderComponent,
    imports: [
      LazyLoadImageDirective,
      MockComponent(AppCardLogoComponent),
      MockComponent(InstallAppButtonComponent),
    ],
    providers: [
      mockProvider(InstalledAppsStore, {
        installedApps$: of([application]),
      }),
    ],
  });
  describe('pool is set up', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          app: application,
          isLoading: false,
        },
      });
    });

    it('shows app logo', () => {
      const logo = spectator.query(AppCardLogoComponent)!;
      expect(logo).toExist();
      expect(logo.url).toBe(application.icon_url);
    });

    it('shows installed badge when app is installed', () => {
      spectator.setInput('app', {
        ...application,
        installed: true,
      });

      const installedBadge = spectator.query('.installed-badge');
      expect(installedBadge).toExist();
      expect(installedBadge).toHaveText('Installed');
    });

    it('shows a button to install the app', () => {
      const installButton = spectator.query(InstallAppButtonComponent);
      expect(installButton).toExist();
      expect(installButton.app).toBe(application);
    });

    describe('other elements', () => {
      it('shows app version', () => {
        expect(spectator.queryAll('.app-list-item')[0]).toHaveText('App Version: 1.0.5');
      });

      it('shows version', () => {
        expect(spectator.queryAll('.app-list-item')[1]).toHaveText('Version: 1.0.0');
      });

      it('shows app keywords', () => {
        expect(spectator.queryAll('.app-list-item')[2]).toHaveText('Keywords: aliens, ufo');
      });

      it('shows app train', () => {
        expect(spectator.queryAll('.app-list-item')[3]).toHaveText('Train: stable');
      });

      it('shows app homepage', () => {
        expect(spectator.queryAll('.app-list-item')[4]).toHaveText('Homepage:seti.org');
      });

      it('shows app description', () => {
        expect(spectator.query('.app-description .description-wrapper').innerHTML)
          .toBe('<b>Seti is great.</b> <p>Find aliens without leaving your home.</p><p></p>');
      });
    });
  });
});
