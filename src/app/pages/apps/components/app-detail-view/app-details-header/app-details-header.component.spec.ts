import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { officialCatalog } from 'app/constants/catalog.constants';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import {
  AppDetailsHeaderComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { AppCatalogPipe } from 'app/pages/apps/utils/app-catalog.pipe';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';

describe('AppDetailsHeaderComponent', () => {
  let spectator: Spectator<AppDetailsHeaderComponent>;
  let loader: HarnessLoader;
  const application = {
    icon_url: 'http://github.com/truenas/icon.png',
    name: 'SETI@home',
    latest_app_version: '1.0.0',
    catalog: officialCatalog,
    tags: ['aliens', 'ufo'],
    train: 'stable',
    home: 'https://www.seti.org',
    app_readme: '<h1>Seti</h1> <b>Seti is great.</b> <p>Find aliens without leaving your home.<p>',
    installed: false,
  } as AvailableApp;

  const createComponent = createComponentFactory({
    component: AppDetailsHeaderComponent,
    imports: [AppCatalogPipe],
    declarations: [
      MockComponent(AppCardLogoComponent),
    ],
    providers: [
      mockProvider(InstalledAppsStore, {
        installedApps$: of([application]),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(Router),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(AuthService, {
        user$: of({ attributes: { appsAgreement: true } }),
      }),
      mockWebsocket([
        mockCall('auth.set_attribute'),
      ]),
    ],
  });
  describe('no pool set up', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          isLoading$: of(false),
          app: application,
        },
        providers: [
          mockProvider(KubernetesStore, {
            selectedPool$: of(null),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });
    it('shows Setup Pool To Install instead if pool is not set', async () => {
      const setupPool = await loader.getHarness(MatButtonHarness.with({ text: 'Setup Pool To Install' }));
      await setupPool.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SelectPoolDialogComponent);
    });
  });

  describe('pool is set up', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          isLoading$: of(false),
          app: application,
        },
        providers: [
          mockProvider(KubernetesStore, {
            selectedPool$: of('has-pool'),
          }),
        ],
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows app logo', () => {
      const logo = spectator.query(AppCardLogoComponent);
      expect(logo).toExist();
      expect(logo.url).toBe(application.icon_url);
    });

    describe('install button', () => {
      it('shows warning if user hasnt agreed to apps agreement', async () => {
        const authService = spectator.inject(AuthService);
        Object.defineProperty(authService, 'user$', { value: of({ attributes: { appsAgreement: false } }) });
        const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
        await installButton.click();
        expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      });
      it('shows an Install button that takes user to installation form', async () => {
        const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
        await installButton.click();

        expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'available', 'TRUENAS', 'stable', 'SETI@home', 'install']);
      });

      it('shows Install Another Instance and installed badge when app is installed', async () => {
        spectator.setInput('app', {
          ...application,
          installed: true,
        });

        const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Another Instance' }));
        expect(installButton).toExist();

        await installButton.click();
        expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'available', 'TRUENAS', 'stable', 'SETI@home', 'install']);

        const installedBadge = spectator.query('.installed-badge');
        expect(installedBadge).toExist();
        expect(installedBadge).toHaveText('Installed');
      });
    });

    describe('other elements', () => {
      it('shows app catalog', () => {
        expect(spectator.query('.catalog-container')).toHaveText('TrueNAS Catalog');
      });

      it('shows app version', () => {
        expect(spectator.queryAll('.app-list-item')[1]).toHaveText('App Version: 1.0.0');
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
        expect(spectator.query('.app-description')).toHaveText('Find aliens without leaving your home.');
      });
    });
  });
});
