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
import { CatalogAppState } from 'app/enums/catalog-app-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { App } from 'app/interfaces/app.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { DockerStatusComponent } from 'app/pages/apps/components/installed-apps/docker-status/docker-status.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('InstalledAppsComponent', () => {
  let spectator: Spectator<InstalledAppsComponent>;

  const app = {
    id: 'ix-test-app',
    name: 'test-app',
    metadata: {
      name: 'rude-cardinal',
      train: 'test-catalog-train',
    },
    state: CatalogAppState.Running,
  } as App;

  const createComponent = createComponentFactory({
    component: InstalledAppsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      MatTableModule,
      MockModule(PageHeaderModule),
    ],
    declarations: [
      EmptyComponent,
      SearchInput1Component,
      DockerStatusComponent,
      AppSettingsButtonComponent,
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

  it('shows a list of installed apps', () => {
    const rows = spectator.queryAll(AppRowComponent);

    expect(rows).toHaveLength(1);
    expect(rows[0].app).toEqual(app);
  });

  it('shows details', () => {
    spectator.click(spectator.query('ix-app-row'));
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
      '/apps/installed', 'test-catalog-train', 'ix-test-app',
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
