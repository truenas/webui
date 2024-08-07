import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, of } from 'rxjs';
import { CatalogAppState } from 'app/enums/chart-release-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { AppControlsComponent } from 'app/pages/dashboard/widgets/apps/common/app-controls/app-controls.component';
import { AppNetworkInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-network-info/app-network-info.component';
import { WidgetAppNetworkComponent } from 'app/pages/dashboard/widgets/apps/widget-app-network/widget-app-network.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';

describe('WidgetAppNetworkComponent', () => {
  let spectator: Spectator<WidgetAppNetworkComponent>;

  const app = {
    id: 'testapp',
    name: 'TestApp',
    portals: {
      web_portal: ['http://test.com'],
    } as Record<string, string[]>,
    status: CatalogAppState.Active,
    update_available: true,
    container_images_update_available: false,
    metadata: {
      icon: 'http://localhost/test-app.png',
      app_version: '1.0',
    },
    catalog: 'truenas',
    catalog_train: 'charts',
  } as unknown as App;

  const createComponent = createComponentFactory({
    component: WidgetAppNetworkComponent,
    imports: [
      MapValuePipe,
      NetworkSpeedPipe,
      FileSizePipe,
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponents(
        AppNetworkInfoComponent,
        AppCardLogoComponent,
        AppControlsComponent,
      ),
    ],
    providers: [
      mockProvider(ErrorHandlerService),
      mockProvider(WidgetResourcesService, {
        serverTime$: of(new Date()),
        getApp: () => of(app),
        getAppStats: () => of({
          network: {
            incoming: 123,
            outgoing: 456,
          },
        }),
      }),
      mockProvider(RedirectService, {
        openWindow: jest.fn(),
      }),
      mockProvider(ApplicationsService, {
        restartApplication: jest.fn(() => of(true)),
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<void, AppStartQueryParams>>>;
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
        size: SlotSize.Half,
        settings: { appName: app.name },
      },
    });
  });

  it('checks components', () => {
    expect(spectator.query(AppControlsComponent)).toBeTruthy();
    expect(spectator.query(AppCardLogoComponent)).toBeTruthy();
    expect(spectator.query(AppNetworkInfoComponent)).toBeTruthy();
  });
});
