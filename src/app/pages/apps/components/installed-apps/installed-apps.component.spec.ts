import { AsyncPipe, Location } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
  Spectator, createRoutingFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent, MockDeclaration, MockModule, MockPipe } from 'ng-mocks';
import { ImgFallbackDirective, ImgFallbackModule } from 'ngx-img-fallback';
import { NgxPopperjsContentComponent, NgxPopperjsDirective, NgxPopperjsLooseDirective } from 'ngx-popperjs';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { InstalledAppsListComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('InstalledAppsComponent', () => {
  let spectator: Spectator<InstalledAppsComponent>;
  let applicationsService: ApplicationsService;

  const app = {
    id: 'ix-test-app',
    name: 'test-app',
    metadata: {
      name: 'rude-cardinal',
      train: 'test-catalog-train',
    },
    state: AppState.Running,
    source: 'TRUENAS',
  } as App;

  const createComponent = createRoutingFactory({
    component: InstalledAppsComponent,
    imports: [
      ImgFallbackModule,
      NgxPopperjsContentComponent,
      NgxPopperjsDirective,
      NgxPopperjsLooseDirective,
      ReactiveFormsModule,
      TranslateModule.forRoot(),
      MatSortModule,
      MatTableModule,
      MatCheckboxModule,
      MatButtonModule,
      MatTooltipModule,
      AsyncPipe,
      RequiresRolesDirective,
      MockComponent(PageHeaderComponent),
      InstalledAppsListComponent,
      AppRowComponent,
      MockComponent(AppStateCellComponent),
      MockComponent(AppUpdateCellComponent),
      MockComponent(FakeProgressBarComponent),
      MockComponent(BasicSearchComponent),
      MockComponent(IxIconComponent),
      MockComponent(EmptyComponent),
      MockComponent(InstalledAppsListBulkActionsComponent),
      MockPipe(FileSizePipe),
      MockPipe(NetworkSpeedPipe),
      TestDirective,
    ],
    declarations: [
      MockDeclaration(AppDetailsPanelComponent),
    ],
    providers: [
      mockProvider(DockerStore, {
        isDockerStarted$: of(true),
        selectedPool$: of('pool'),
      }),
      mockProvider(InstalledAppsStore, {
        isLoading$: of(false),
        installedApps$: of([app]),
      }),
      mockProvider(LayoutService, {
        navigatePreservingScroll: jest.fn(() => of()),
      }),
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([]),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectAdvancedConfig,
            value: {},
          },
        ],
      }),
      mockProvider(Router, {
        events: of(),
      }),
      mockProvider(ApplicationsService, {
        restartApplication: jest.fn(() => of()),
        startApplication: jest.fn(() => of()),
        stopApplication: jest.fn(() => of()),
        getInstalledAppsStatusUpdates: jest.fn(() => of({
          fields: { arguments: ['test-app', { replica_count: 1 }], state: JobState.Success },
        })),
      }),
      mockApi([]),
      mockAuth(),
      mockProvider(AppsStatsService, {
        getStatsForApp: jest.fn(() => of({
          cpu_usage: 0,
          memory: 0,
          blkio: { read: 0, write: 0 },
          networks: [],
        })),
      }),
      mockProvider(MatDialog),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(Location, {
        replaceState: jest.fn(),
      }),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
    ],
    params: { appId: 'ix-test-app' },
  });

  beforeEach(async () => {
    spectator = createComponent();
    applicationsService = spectator.inject(ApplicationsService);

    // Wait for component initialization and subscriptions to complete
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    // Retry up to 20 seconds for child component to be ready with data
    const timeout = 20000;
    const interval = 100;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const listComponent = spectator.component.installedAppsList();
      if (listComponent && listComponent.dataSource.length > 0) {
        // Child is ready, trigger final change detection
        spectator.detectChanges();
        return;
      }
      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, interval));
      spectator.detectChanges();
    }

    // Timeout reached, fail the test
    const listComponent = spectator.component.installedAppsList();
    expect(listComponent).toBeDefined();
    expect(listComponent?.dataSource.length).toBeGreaterThan(0);
  });

  it('shows a list of installed apps', () => {
    const rows = spectator.queryAll(AppRowComponent);

    expect(rows).toHaveLength(1);
    expect(rows[0].app()).toEqual(app);
  });

  it('shows details', () => {
    const router = spectator.inject(Router);
    spectator.click(spectator.query('ix-app-row')!);
    expect(spectator.inject(LayoutService).navigatePreservingScroll).toHaveBeenCalledWith(router, [
      '/apps/installed', 'test-catalog-train', 'ix-test-app',
    ]);
  });

  it('starts application', () => {
    spectator.component.start('test-app');
    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app');
  });

  it('stops application', () => {
    spectator.component.stop('test-app');
    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app');
  });

  it('restarts application', () => {
    spectator.query(AppRowComponent)!.restartApp.emit();
    expect(applicationsService.restartApplication).toHaveBeenCalledWith('test-app');
  });
});
