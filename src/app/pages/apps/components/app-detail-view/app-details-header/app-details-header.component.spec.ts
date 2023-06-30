import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import {
  AppDetailsHeaderComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { SelectPoolDialogComponent } from 'app/pages/apps-old/select-pool-dialog/select-pool-dialog.component';

describe('AppDetailsHeaderComponent', () => {
  let spectator: Spectator<AppDetailsHeaderComponent>;
  let loader: HarnessLoader;
  const application = {
    icon_url: 'http://github.com/truenas/icon.png',
    name: 'SETI@home',
    latest_app_version: '1.0.0',
    catalog: 'Truenas',
    tags: ['aliens', 'ufo'],
    train: 'stable',
    home: 'https://www.seti.org',
    app_readme: 'Find aliens without leaving your home.',
    installed: false,
  } as AvailableApp;

  const createComponent = createComponentFactory({
    component: AppDetailsHeaderComponent,
    declarations: [
      MockComponent(AppCardLogoComponent),
    ],
    providers: [
      mockProvider(InstalledAppsStore, {
        installedApps$: of([application]),
      }),
      mockProvider(KubernetesStore, {
        selectedPool$: of('has-pool'),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading$: of(false),
        app: application,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows app logo', () => {
    const logo = spectator.query(AppCardLogoComponent);
    expect(logo).toExist();
    expect(logo.url).toBe(application.icon_url);
  });

  describe('install button', () => {
    it('shows an Install button that takes user to installation form', async () => {
      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
      await installButton.click();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'available', 'Truenas', 'stable', 'SETI@home', 'install']);
    });

    it('shows Setup Pool To Install instead if pool is not set', async () => {
      const store = spectator.inject(KubernetesStore);
      Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
      spectator.component.ngOnInit();

      const setupPool = await loader.getHarness(MatButtonHarness.with({ text: 'Setup Pool To Install' }));
      await setupPool.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SelectPoolDialogComponent);
    });

    it('shows Install Another Instance and installed badge when app is installed', async () => {
      spectator.setInput('app', {
        ...application,
        installed: true,
      });

      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Another Instance' }));
      expect(installButton).toExist();

      await installButton.click();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'available', 'Truenas', 'stable', 'SETI@home', 'install']);

      const installedBadge = spectator.query('.installed-badge');
      expect(installedBadge).toExist();
      expect(installedBadge).toHaveText('Installed');
    });
  });

  describe('other elements', () => {
    it('shows app catalog', () => {
      expect(spectator.query('.catalog-container')).toHaveText('Truenas Catalog');
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
