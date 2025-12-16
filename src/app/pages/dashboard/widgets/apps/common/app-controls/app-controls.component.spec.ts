import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, Observable } from 'rxjs';
import { mockJob } from 'app/core/testing/utils/mock-api.utils';
import { AppState } from 'app/enums/app-state.enum';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { AppControlsComponent } from './app-controls.component';

describe('AppControlsComponent', () => {
  let spectator: Spectator<AppControlsComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'testapp',
    name: 'TestApp',
    portals: {
      'Web UI': 'http://test.com',
      'Other UI': 'https://other.example.com',
    } as Record<string, string>,
    state: AppState.Running,
    upgrade_available: true,
    metadata: {
      icon: 'http://localhost/test-app.png',
      app_version: '1.0',
      train: 'stable',
    },
  } as App;

  const createComponent = createComponentFactory({
    component: AppControlsComponent,
    declarations: [],
    providers: [
      mockProvider(RedirectService, {
        openWindow: jest.fn(),
      }),
      mockProvider(ApplicationsService, {
        restartApplication: jest.fn(() => mockJob('app.redeploy')),
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<void, AppStartQueryParams>>>;
        }),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app: {
          isLoading: false,
          error: null,
          value: app,
        } as LoadingState<App>,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks open web portal', async () => {
    const redirectSpy = jest.spyOn(spectator.inject(RedirectService), 'openWindow');

    const portalButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-web' }));
    await portalButton.click();

    expect(redirectSpy).toHaveBeenCalledWith('http://test.com');
  });

  it('should open portal menu and show other portals', async () => {
    const redirectSpy = jest.spyOn(spectator.inject(RedirectService), 'openWindow');

    const otherPortalsButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-menu-down' }));
    expect(otherPortalsButton).toExist();

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Other UI' });

    expect(redirectSpy).toHaveBeenCalledWith('https://other.example.com');
  });

  it('should call openPortal with correct url when menu item clicked', () => {
    const openPortalSpy = jest.spyOn(spectator.component, 'openPortal');

    spectator.click('[ixTest="apps-web-portal-dropdown"]');
    spectator.detectChanges();

    const menuItem = spectator.queryAll('button[mat-menu-item]')[0];
    spectator.click(menuItem);

    expect(openPortalSpy).toHaveBeenCalledWith('https://other.example.com');
  });

  it('checks restart app', async () => {
    const restartSpy = jest.spyOn(spectator.inject(ApplicationsService), 'restartApplication');
    const dialogSpy = jest.spyOn(spectator.inject(DialogService), 'jobDialog');

    const restartButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-restart' }));
    await restartButton.click();

    expect(restartSpy).toHaveBeenCalledWith(app.name);
    expect(dialogSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Restarting App',
        canMinimize: true,
      }),
    );
  });

  it('checks redirect to installed apps page', async () => {
    jest.spyOn(spectator.inject(Router), 'navigate');

    const appButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-cog' }));
    await appButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'installed', app.metadata.train, app.id]);
  });
});
