import { fakeAsync } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { Observable, of } from 'rxjs';
import { AppState } from 'app/enums/app-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { AppCardInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-card-info/app-card-info.component';
import { AppControlsComponent } from 'app/pages/dashboard/widgets/apps/common/app-controls/app-controls.component';
import { AppCpuInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-cpu-info/app-cpu-info.component';
import { AppDiskInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-disk-info/app-disk-info.component';
import { AppMemoryInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-memory-info/app-memory-info.component';
import { AppNetworkInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-network-info/app-network-info.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { WidgetAppComponent } from './widget-app.component';

describe('WidgetAppComponent', () => {
  let spectator: Spectator<WidgetAppComponent>;

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
      train: 'charts',
    },
  } as App;

  const createComponent = createComponentFactory({
    component: WidgetAppComponent,
    imports: [
      LazyLoadImageDirective,
      NgxSkeletonLoaderComponent,
      MockComponents(
        AppCardInfoComponent,
        AppCardLogoComponent,
        AppControlsComponent,
        AppCpuInfoComponent,
        AppMemoryInfoComponent,
        AppNetworkInfoComponent,
        AppDiskInfoComponent,
      ),
    ],
    providers: [
      mockProvider(ErrorHandlerService),
      mockProvider(WidgetResourcesService, {
        serverTime$: of(new Date()),
        getApp: () => of(app),
        getAppStats: () => of({}),
        getAppStatusUpdates: () => of(),
      }),
      mockProvider(RedirectService, {
        openWindow: jest.fn(),
      }),
      mockProvider(ApplicationsService, {
        restartApplication: jest.fn(() => of(true)),
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<unknown, AppStartQueryParams>>>;
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
  });

  it('checks components', fakeAsync(() => {
    spectator.detectChanges();
    expect(spectator.query(AppControlsComponent)).toBeTruthy();
    expect(spectator.query(AppCardLogoComponent)).toBeTruthy();
    expect(spectator.query(AppCardInfoComponent)).toBeTruthy();
    expect(spectator.query(AppCpuInfoComponent)).toBeTruthy();
    expect(spectator.query(AppMemoryInfoComponent)).toBeTruthy();
    expect(spectator.query(AppNetworkInfoComponent)).toBeTruthy();
    expect(spectator.query(AppDiskInfoComponent)).toBeTruthy();
  }));
});
