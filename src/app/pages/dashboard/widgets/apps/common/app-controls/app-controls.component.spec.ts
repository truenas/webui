import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, Observable } from 'rxjs';
import { AppState } from 'app/enums/app-state.enum';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
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
        restartApplication: jest.fn(() => of(true)),
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<void, AppStartQueryParams>>>;
        }),
      }),
      mockProvider(SnackbarService, {
        success: jest.fn(),
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

  it('checks restart app', async () => {
    const restartSpy = jest.spyOn(spectator.inject(ApplicationsService), 'restartApplication');
    const snackbarSpy = jest.spyOn(spectator.inject(SnackbarService), 'success');

    const restartButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-restart' }));
    await restartButton.click();

    expect(snackbarSpy).toHaveBeenCalledWith('App is restarting');
    expect(restartSpy).toHaveBeenCalledWith(app.name);
  });

  it('checks redirect to installed apps page', async () => {
    jest.spyOn(spectator.inject(Router), 'navigate');

    const appButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-cog' }));
    await appButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'installed', app.metadata.train, app.id]);
  });
});
