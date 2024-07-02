import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { ChartScaleResult, ChartScaleQueryParams } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFileSizePipe } from 'app/modules/pipes/ix-file-size/ix-file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
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

  const app = {
    id: 'testapp',
    name: 'TestApp',
    portals: {
      web_portal: ['http://test.com'],
    },
    status: ChartReleaseStatus.Active,
    update_available: true,
    container_images_update_available: false,
    chart_metadata: {
      icon: '',
      appVersion: '1.0',
    },
    catalog: 'truenas',
    catalog_train: 'charts',
  } as unknown as ChartRelease;

  const createComponent = createComponentFactory({
    component: WidgetAppComponent,
    imports: [MapValuePipe, IxFileSizePipe],
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
        getAppStats: () => of({
          cpu: 55,
          memory: 1234,
          network: { in: 100, out: 200 },
        }),
      }),
      mockProvider(ThemeService, {
        currentTheme: () => ({ blue: '#0000FF', orange: '#FFA500' }),
      }),
      mockProvider(RedirectService),
      mockProvider(ApplicationsService, {
        restartApplication: jest.fn(() => of(true)),
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<ChartScaleResult, ChartScaleQueryParams>>>;
        }),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
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
  });

  it('should generate correct chart data', () => {
    const chartData = spectator.component.networkStats();

    expect(chartData).toHaveLength(60);
    expect(chartData[chartData.length - 1]).toEqual([100, 200]);
    expect(chartData[chartData.length - 2]).toEqual([0, 0]);
    expect(chartData[chartData.length - 3]).toEqual([0, 0]);
  });

  it('should open web portal', () => {
    const redirectSpy = jest.spyOn(spectator.inject(RedirectService), 'openWindow');

    spectator.component.openWebPortal(app);

    expect(redirectSpy).toHaveBeenCalledWith('http://test.com');
  });

  it('should split memory correctly', () => {
    const result = spectator.component.splitMemory('512 MiB');
    expect(result).toEqual([512, 'MiB']);
  });
});
