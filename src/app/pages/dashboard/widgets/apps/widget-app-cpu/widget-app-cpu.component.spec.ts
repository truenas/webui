import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, of } from 'rxjs';
import { AppState } from 'app/enums/app-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { AppControlsComponent } from 'app/pages/dashboard/widgets/apps/common/app-controls/app-controls.component';
import { AppCpuInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-cpu-info/app-cpu-info.component';
import { WidgetAppCpuComponent } from 'app/pages/dashboard/widgets/apps/widget-app-cpu/widget-app-cpu.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';

describe('WidgetAppCpuComponent', () => {
  let spectator: Spectator<WidgetAppCpuComponent>;

  const app = {
    id: 'testapp',
    name: 'TestApp',
    state: AppState.Running,
    upgrade_available: true,
    metadata: {
      icon: 'http://localhost/test-app.png',
      train: 'charts',
      app_version: '1.0',
    },
  } as App;

  const createComponent = createComponentFactory({
    component: WidgetAppCpuComponent,
    imports: [
      MapValuePipe,
      NetworkSpeedPipe,
      FileSizePipe,
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponents(
        AppControlsComponent,
        AppCpuInfoComponent,
      ),
    ],
    providers: [
      mockProvider(ErrorHandlerService),
      mockProvider(WidgetResourcesService, {
        getApp: () => of(app),
        getAppStats: () => of({
          cpu: 55,
          memory: 1234,
          network: { in: 100, out: 200 },
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
        size: SlotSize.Quarter,
        settings: { appName: app.name },
      },
    });
  });

  it('checks components', () => {
    expect(spectator.query(AppControlsComponent)).toBeTruthy();
    expect(spectator.query(AppCpuInfoComponent)).toBeTruthy();
  });
});
