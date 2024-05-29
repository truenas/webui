import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Spectator, createComponentFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockDeclaration, MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { KubernetesStatusComponent } from 'app/pages/apps/components/installed-apps/kubernetes-status/kubernetes-status.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatisticsService } from 'app/pages/apps/store/apps-statistics.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { AppCatalogPipe } from 'app/pages/apps/utils/app-catalog.pipe';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('InstalledAppsComponent', () => {
  let spectator: Spectator<InstalledAppsComponent>;

  const app = {
    id: 'ix-test-app',
    name: 'test-app',
    chart_metadata: {
      name: 'rude-cardinal',
    },
    catalog: 'test-catalog',
    catalog_train: 'test-catalog-train',
    status: ChartReleaseStatus.Active,
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: InstalledAppsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppCatalogPipe,
      MatTableModule,
      MockModule(PageHeaderModule),
    ],
    declarations: [
      EmptyComponent,
      SearchInput1Component,
      KubernetesStatusComponent,
      AppSettingsButtonComponent,
      MockDeclaration(AppDetailsPanelComponent),
      MockDeclaration(AppRowComponent),
    ],
    providers: [
      mockProvider(KubernetesStore, {
        isLoading$: of(false),
        isKubernetesStarted$: of(true),
        selectedPool$: of('pool'),
      }),
      mockProvider(InstalledAppsStore, {
        isLoading$: of(false),
        installedApps$: of([app]),
      }),
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([]),
        catalogs$: of([]),
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
        startApplication: jest.fn(() => of()),
        stopApplication: jest.fn(() => of()),
        getInstalledAppsStatusUpdates: jest.fn(() => of({
          fields: { arguments: ['test-app', { replica_count: 1 }], state: JobState.Success },
        })),
      }),
      mockProvider(AppsStatisticsService),
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
      mockWebSocket([]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('loads chart releases', () => {
    expect(spectator.component.dataSource).toEqual([app]);
  });

  it('shows details', () => {
    spectator.click(spectator.query('ix-app-row'));
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
      '/apps/installed', 'test-catalog', 'test-catalog-train', 'ix-test-app',
    ]);
  });

  it('starts application', () => {
    spectator.query(AppRowComponent).startApp.emit();
    expect(spectator.inject(ApplicationsService).startApplication).toHaveBeenCalledWith('test-app');
  });

  it('stops application', () => {
    spectator.query(AppRowComponent).stopApp.emit();
    expect(spectator.inject(ApplicationsService).stopApplication).toHaveBeenCalledWith('test-app');
  });
});
