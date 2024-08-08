import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, of } from 'rxjs';
import { CatalogAppState } from 'app/enums/chart-release-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { ChartScaleResult, AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WidgetAppComponent } from './widget-app.component';

describe('WidgetAppComponent', () => {
  let spectator: Spectator<WidgetAppComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'testapp',
    name: 'TestApp',
    portals: {
      web_portal: ['http://test.com'],
    } as Record<string, string[]>,
    state: CatalogAppState.Active,
    upgrade_available: true,
    container_images_update_available: false,
    metadata: {
      icon: 'http://localhost/test-app.png',
      appVersion: '1.0',
    },
    catalog: 'truenas',
    catalog_train: 'charts',
  } as App;

  const createComponent = createComponentFactory({
    component: WidgetAppComponent,
    imports: [
      MapValuePipe,
      NetworkSpeedPipe,
      FileSizePipe,
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponent(AppStatusCellComponent),
      MockComponent(AppUpdateCellComponent),
      MockComponent(AppCardLogoComponent),
      MockComponent(NetworkChartComponent),
    ],
    providers: [
      mockProvider(ErrorHandlerService),
      mockProvider(WidgetResourcesService, {
        serverTime$: of(new Date()),
        getApp: () => of(app),
      }),
      mockProvider(ThemeService, {
        currentTheme: () => ({ blue: '#0000FF', orange: '#FFA500' }),
      }),
      mockProvider(RedirectService, {
        openWindow: jest.fn(),
      }),
      mockProvider(ApplicationsService, {
        restartApplication: jest.fn(() => of(true)),
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<ChartScaleResult, AppStartQueryParams>>>;
        }),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(SnackbarService, {
        success: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
        settings: { appName: app.name },
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks status rows', () => {
    expect(spectator.query('.app-header .name')).toHaveText('TestApp');
    expect(spectator.query(AppStatusCellComponent)).toBeTruthy();
    expect(spectator.query(AppUpdateCellComponent)).toBeTruthy();
  });

  it('should split memory correctly', () => {
    const result = spectator.component.splitMemory('512 MiB');
    expect(result).toEqual([512, 'MiB']);
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
    expect(restartSpy).toHaveBeenCalledWith(app);
  });
});
