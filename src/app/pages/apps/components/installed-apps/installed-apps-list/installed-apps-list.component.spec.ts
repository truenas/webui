import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { MockDeclaration } from 'ng-mocks';
import { ImgFallbackDirective } from 'ngx-img-fallback';
import { NgxPopperjsContentComponent, NgxPopperjsDirective, NgxPopperjsLooseDirective } from 'ngx-popperjs';
import { BehaviorSubject, of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppBulkUpdateComponent } from 'app/pages/apps/components/installed-apps/app-bulk-update/app-bulk-update.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { InstalledAppsListComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { AppsSortDirection, InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('InstalledAppsListComponent', () => {
  let spectator: Spectator<InstalledAppsListComponent>;
  let applicationsService: ApplicationsService;
  let loader: HarnessLoader;
  let searchQuery$: BehaviorSubject<string>;
  let sortingInfo$: BehaviorSubject<{ active: string; direction: AppsSortDirection }>;
  let installedApps$: BehaviorSubject<App[]>;

  const apps = [
    {
      id: 'ix-test-app-1',
      name: 'test-app-1',
      metadata: {
        name: 'rude-cardinal',
        train: 'test-catalog-train',
      },
      state: AppState.Running,
      upgrade_available: true,
    },
    {

      id: 'ix-test-app-2',
      name: 'test-app-2',
      metadata: {
        name: 'rude-cardinal',
        train: 'test-catalog-train',
      },
      state: AppState.Stopped,
      upgrade_available: true,
    },
  ] as App[];

  const createComponent = createRoutingFactory({
    component: InstalledAppsListComponent,
    imports: [
      FakeProgressBarComponent,
      ImgFallbackDirective,
      NgxPopperjsContentComponent,
      NgxPopperjsLooseDirective,
      NgxPopperjsDirective,
    ],
    declarations: [
      EmptyComponent,
      BasicSearchComponent,
      MockDeclaration(AppDetailsPanelComponent),
    ],
    providers: [
      mockProvider(DockerStore, {
        isDockerStarted$: of(true),
        selectedPool$: of('pool'),
      }),
      {
        provide: InstalledAppsStore,
        useFactory: () => {
          searchQuery$ = new BehaviorSubject('');
          sortingInfo$ = new BehaviorSubject({ active: 'application', direction: 'asc' as AppsSortDirection });
          installedApps$ = new BehaviorSubject(apps);
          return {
            isLoading$: of(false),
            installedApps$: installedApps$.asObservable(),
            searchQuery$: searchQuery$.asObservable(),
            sortingInfo$: sortingInfo$.asObservable(),
            setSearchQuery: jest.fn((query: string) => searchQuery$.next(query)),
            setSortingInfo: jest.fn(
              (info: { active: string; direction: AppsSortDirection }) => sortingInfo$.next(info),
            ),
          };
        },
      },
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([]),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({ result: [{ error: 'test error' }] }),
        })),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(null),
        })),
      }),
      mockProvider(LayoutService, {
        navigatePreservingScroll: jest.fn(() => of()),
      }),
      mockProvider(Router, {
        events: of(),
        navigate: jest.fn().mockResolvedValue(true),
      }),
      mockProvider(ApplicationsService, {
        restartApplication: jest.fn(() => of(null)),
        startApplication: jest.fn(() => of(null)),
        stopApplication: jest.fn(() => of(null)),
        getInstalledAppsStatusUpdates: jest.fn(() => of({
          fields: { arguments: ['test-app', { replica_count: 1 }], state: JobState.Success },
        })),
        checkIfAppIxVolumeExists: jest.fn(() => of(true)),
      }),
      mockApi([
        mockJob('core.bulk'),
      ]),
      mockAuth(),
      mockProvider(AppsStatsService, {
        getStatsForApp: jest.fn(() => of(null)),
      }),
    ],
    params: { appId: 'webdav', train: 'community' },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    applicationsService = spectator.inject(ApplicationsService);
  });

  async function selectAllApps(): Promise<void> {
    const table = await loader.getHarness(TnTableHarness);
    await table.toggleSelectAll();
    spectator.detectChanges();
  }

  it('shows a list of apps', async () => {
    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getRowCount()).toBe(2);
  });

  it('shows an empty list when there are no search results', () => {
    expect(spectator.query(EmptyComponent)).not.toExist();

    spectator.query(BasicSearchComponent)!.queryChange.emit('test-app-3');
    spectator.detectChanges();

    expect(spectator.query('tn-table')).not.toExist();
    expect(spectator.query(EmptyComponent)).toExist();
  });

  it('shows details', async () => {
    const locationSpy = jest.spyOn(spectator.inject(Location), 'replaceState');
    const table = await loader.getHarness(TnTableHarness);
    await table.clickRow(0);

    expect(locationSpy).toHaveBeenCalledWith('/apps/installed/test-catalog-train/ix-test-app-1');
    expect(spectator.component.selectedApp).toEqual(apps[0]);
  });

  it('keeps the selected app (and URL) when the list refreshes, e.g. after start/stop', async () => {
    const table = await loader.getHarness(TnTableHarness);
    await table.clickRow(1);
    expect(spectator.component.selectedApp).toEqual(apps[1]);

    const locationSpy = jest.spyOn(spectator.inject(Location), 'replaceState');

    // Simulate the installedApps$ re-emission that follows a start/stop.
    installedApps$.next([...apps]);
    spectator.detectChanges();

    expect(spectator.component.selectedApp).toEqual(apps[1]);
    expect(locationSpy).not.toHaveBeenCalled();
  });

  it('starts application', async () => {
    const startButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'play-circle' }));
    await startButton.click();
    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app-2');
  });

  it('stops application', async () => {
    const stopButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'stop-circle' }));
    await stopButton.click();
    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('restarts application', async () => {
    const restartButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'restart' }));
    await restartButton.click();
    expect(applicationsService.restartApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('starts several applications', async () => {
    await selectAllApps();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkStart.emit();

    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app-2');
  });

  it('stops several applications', async () => {
    await selectAllApps();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkStop.emit();

    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('updates several applications', async () => {
    await selectAllApps();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkUpdate.emit();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(AppBulkUpdateComponent, { data: apps });
  });

  it('removes several applications', async () => {
    jest.spyOn(spectator.inject(TnDialog), 'open').mockReturnValue({
      closed: of({ removeVolumes: true, removeImages: true }),
    } as DialogRef);

    await selectAllApps();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkDelete.emit();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(AppDeleteDialog, {
      data: {
        name: 'ix-test-app-1, ix-test-app-2',
        showRemoveVolumes: true,
      },
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', [
      'app.delete',
      [
        [
          'ix-test-app-1',
          { remove_images: true, remove_ix_volumes: true },
        ],
        [
          'ix-test-app-2',
          { remove_images: true, remove_ix_volumes: true },
        ],
      ],
    ]);
  });

  it('handles sortChanged with empty apps array correctly', () => {
    const component = spectator.component;
    const originalDataSource = [...apps];
    component.dataSource.set(originalDataSource);

    component.setDatasourceWithSort({ active: 'application', direction: 'asc' as AppsSortDirection }, []);

    expect(component.dataSource()).toHaveLength(2);
    expect(component.dataSource()[0].name).toBe('test-app-1');
    expect(component.dataSource()[1].name).toBe('test-app-2');
  });

  it('handles sortChanged with valid apps array correctly', () => {
    const component = spectator.component;
    const newApps = [{
      id: 'ix-new-app',
      name: 'new-app',
      metadata: { name: 'new-app', train: 'test' },
      state: AppState.Running,
      upgrade_available: false,
    }] as App[];

    component.setDatasourceWithSort({ active: 'application', direction: 'asc' as AppsSortDirection }, newApps);

    expect(component.dataSource()).toHaveLength(1);
    expect(component.dataSource()[0].name).toBe('new-app');
  });

  it('falls back to the default application/asc sort when tn-table clears the direction', () => {
    const store = spectator.inject(InstalledAppsStore);

    spectator.triggerEventHandler('tn-table', 'sortChange', { column: 'state', direction: '' });

    expect(store.setSortingInfo).toHaveBeenLastCalledWith({ active: 'application', direction: 'asc' });
  });
});
