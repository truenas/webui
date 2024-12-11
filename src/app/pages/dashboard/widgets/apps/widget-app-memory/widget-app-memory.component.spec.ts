import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponents } from 'ng-mocks';
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
import { AppMemoryInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-memory-info/app-memory-info.component';
import { WidgetAppMemoryComponent } from 'app/pages/dashboard/widgets/apps/widget-app-memory/widget-app-memory.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';

describe('WidgetAppMemoryComponent', () => {
  let spectator: Spectator<WidgetAppMemoryComponent>;

  const app = {
    id: 'testapp',
    name: 'TestApp',
    state: AppState.Running,
    metadata: {
      icon: 'http://localhost/test-app.png',
      app_version: '1.0',
      train: 'stable',
    },
  } as App;

  const createComponent = createComponentFactory({
    component: WidgetAppMemoryComponent,
    imports: [
      LazyLoadImageDirective,
      MockComponents(
        AppCardInfoComponent,
        AppCardLogoComponent,
        AppControlsComponent,
        AppMemoryInfoComponent,
      ),
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
    expect(spectator.query(AppMemoryInfoComponent)).toBeTruthy();
  });
});
