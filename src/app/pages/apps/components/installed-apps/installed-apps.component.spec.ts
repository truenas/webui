import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Spectator, createComponentFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent, MockDeclaration } from 'ng-mocks';
import { ImgFallbackDirective } from 'ngx-img-fallback';
import { NgxPopperjsContentComponent, NgxPopperjsDirective, NgxPopperjsLooseDirective } from 'ngx-popperjs';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
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
  } as App;

  const createComponent = createComponentFactory({
    component: InstalledAppsComponent,
    imports: [
      ImgFallbackDirective,
      NgxPopperjsContentComponent,
      NgxPopperjsDirective,
      NgxPopperjsLooseDirective,
      ReactiveFormsModule,
      MockComponent(PageHeaderComponent),
    ],
    declarations: [
      MockDeclaration(AppDetailsPanelComponent),
      MockDeclaration(AppRowComponent),
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
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: () => app.id,
            },
          },
        },
      },
      mockApi([]),
      mockAuth(),
      mockProvider(AppsStatsService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.installedAppsList().dataSource = [app];
    applicationsService = spectator.inject(ApplicationsService);
  });

  it('shows a list of installed apps', () => {
    const rows = spectator.queryAll(AppRowComponent);

    expect(rows).toHaveLength(1);
    expect(rows[0].app()).toEqual(app);
  });

  it('shows details', () => {
    spectator.click(spectator.query('ix-app-row'));
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
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
    spectator.query(AppRowComponent).restartApp.emit();
    expect(applicationsService.restartApplication).toHaveBeenCalledWith('test-app');
  });
});
