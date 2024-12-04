import { MatTableModule } from '@angular/material/table';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockDeclaration } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { App } from 'app/interfaces/app.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { InstalledAppsListComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list.component';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

const apps = [
  {
    id: 'ix-test-app-1',
    name: 'test-app-1',
    metadata: {
      name: 'rude-cardinal',
      train: 'test-catalog-train',
    },
    state: AppState.Running,
  },
  {

    id: 'ix-test-app-2',
    name: 'test-app-2',
    metadata: {
      name: 'rude-cardinal',
      train: 'test-catalog-train',
    },
    state: AppState.Running,
  },
] as App[];

describe('InstalledAppsListComponent', () => {
  let spectator: Spectator<InstalledAppsListComponent>;

  const createComponent = createComponentFactory({
    component: InstalledAppsListComponent,
    imports: [
      MatTableModule,
      FakeProgressBarComponent,
    ],
    declarations: [
      EmptyComponent,
      SearchInput1Component,
      InstalledAppsListBulkActionsComponent,
      MockDeclaration(AppDetailsPanelComponent),
    ],
    providers: [
      mockProvider(DockerStore, {
        isDockerStarted$: of(true),
        selectedPool$: of('pool'),
      }),
      mockProvider(InstalledAppsStore, {
        isLoading$: of(false),
        installedApps$: of(apps),
      }),
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([]),
      }),
      mockProvider(AppsStatsService),
      mockApi([]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a list of apps', () => {
    const appRows = spectator.queryAll(AppRowComponent);

    expect(appRows).toHaveLength(2);
    expect(appRows[0].app()).toEqual(apps[0]);
    expect(appRows[1].app()).toEqual(apps[1]);
  });
});
