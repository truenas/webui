import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockDeclaration } from 'ng-mocks';
import { ImgFallbackDirective } from 'ngx-img-fallback';
import { NgxPopperjsContentComponent, NgxPopperjsDirective, NgxPopperjsLooseDirective } from 'ngx-popperjs';
import { firstValueFrom, of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { App, AppStats } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppBulkUpdateComponent } from 'app/pages/apps/components/installed-apps/app-bulk-update/app-bulk-update.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { InstalledAppsListComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('InstalledAppsListComponent', () => {
  let spectator: Spectator<InstalledAppsListComponent>;
  let applicationsService: ApplicationsService;
  let loader: HarnessLoader;

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
      source: 'TRUENAS',
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
      source: 'TRUENAS',
    },
    {
      id: 'external-nginx',
      name: 'external-nginx',
      metadata: {
        name: 'nginx',
        train: 'external',
      },
      state: AppState.Running,
      upgrade_available: false,
      source: 'EXTERNAL',
    },
  ] as App[];

  const createComponent = createRoutingFactory({
    component: InstalledAppsListComponent,
    imports: [
      MatTableModule,
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
      mockProvider(InstalledAppsStore, {
        isLoading$: of(false),
        installedApps$: of(apps),
      }),
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([]),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({ result: [{ error: 'test error' }] }),
        })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(null),
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
        getStatsForApp: jest.fn(() => of({
          cpu_usage: 0,
          memory: 0,
          blkio: { read: 0, write: 0 },
          networks: [],
        })),
      }),
    ],
    params: { appId: 'webdav', train: 'community' },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    applicationsService = spectator.inject(ApplicationsService);
  });

  it('shows a list of apps', () => {
    const appRows = spectator.queryAll(AppRowComponent);

    expect(appRows).toHaveLength(3);
    expect(appRows[0].app()).toEqual(apps[0]);
    expect(appRows[1].app()).toEqual(apps[1]);
    expect(appRows[2].app()).toEqual(apps[2]);
  });

  it('shows an empty list when there are no search results', () => {
    expect(spectator.query(EmptyComponent)).not.toExist();

    spectator.query(BasicSearchComponent)!.queryChange.emit('test-app-3');
    spectator.detectChanges();

    const appRows = spectator.queryAll(AppRowComponent);
    expect(appRows).toHaveLength(0);

    expect(spectator.query(EmptyComponent)).toExist();
  });

  it('shows details', () => {
    const router = spectator.inject(Router);
    spectator.click(spectator.query('ix-app-row')!);
    expect(spectator.inject(LayoutService).navigatePreservingScroll).toHaveBeenCalledWith(router, [
      '/apps/installed', 'test-catalog-train', 'ix-test-app-1',
    ]);
  });

  it('starts application', () => {
    spectator.query(AppRowComponent)!.startApp.emit();
    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('stops application', () => {
    spectator.query(AppRowComponent)!.stopApp.emit();
    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('restarts application', () => {
    spectator.query(AppRowComponent)!.restartApp.emit();
    expect(applicationsService.restartApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('starts several applications', async () => {
    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkStart.emit();

    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app-2');
  });

  it('select all checkbox does not select external apps', async () => {
    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();

    expect(spectator.component.selection.isSelected('external-nginx')).toBe(false);
    expect(spectator.component.selection.isSelected('ix-test-app-1')).toBe(true);
    expect(spectator.component.selection.isSelected('ix-test-app-2')).toBe(true);
  });

  it('stops several applications', async () => {
    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkStop.emit();

    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('updates several applications', async () => {
    spectator.component.dataSource = apps;
    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkUpdate.emit();

    // Should only include selected TrueNAS apps (external apps are excluded from selection)
    const truenasApps = apps.filter((app) => app.source === 'TRUENAS');
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppBulkUpdateComponent, { data: truenasApps });
  });

  it('removes several applications', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of({ removeVolumes: true, removeImages: true }),
    } as MatDialogRef<unknown>);

    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent)!.bulkDelete.emit();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppDeleteDialog, {
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
    component.dataSource = originalDataSource;

    component.setDatasourceWithSort({ active: 'application', direction: 'asc' }, []);

    expect(component.dataSource).toHaveLength(3);
    expect(component.dataSource[0].name).toBe('external-nginx');
    expect(component.dataSource[1].name).toBe('test-app-1');
    expect(component.dataSource[2].name).toBe('test-app-2');
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

    component.setDatasourceWithSort({ active: 'application', direction: 'asc' }, newApps);

    expect(component.dataSource).toHaveLength(1);
    expect(component.dataSource[0].name).toBe('new-app');
  });

  describe('external apps', () => {
    it('filters TrueNAS apps and external apps into separate lists', () => {
      const component = spectator.component;
      component.dataSource = apps;

      const truenasApps = component.filteredTruenasApps;
      const externalApps = component.filteredExternalApps;

      expect(truenasApps).toHaveLength(2);
      expect(truenasApps[0].source).toBe('TRUENAS');
      expect(truenasApps[1].source).toBe('TRUENAS');

      expect(externalApps).toHaveLength(1);
      expect(externalApps[0].source).toBe('EXTERNAL');
      expect(externalApps[0].name).toBe('external-nginx');
    });

    it('excludes external apps from bulk selection', () => {
      const component = spectator.component;
      component.dataSource = apps;

      // Select all apps
      component.selection.select('ix-test-app-1', 'ix-test-app-2', 'external-nginx');

      const checkedApps = component.checkedApps;

      // Only TrueNAS apps should be in checkedApps
      expect(checkedApps).toHaveLength(2);
      expect(checkedApps.every((app) => app.source === 'TRUENAS')).toBe(true);
      expect(checkedApps.some((app) => app.name === 'external-nginx')).toBe(false);
    });

    it('excludes external apps from active checked apps', () => {
      const component = spectator.component;
      component.dataSource = apps;

      // Select all running apps (including external)
      component.selection.select('ix-test-app-1', 'external-nginx');

      const activeCheckedApps = component.activeCheckedApps;

      // Only TrueNAS running apps should be included
      expect(activeCheckedApps).toHaveLength(1);
      expect(activeCheckedApps[0].name).toBe('test-app-1');
      expect(activeCheckedApps[0].source).toBe('TRUENAS');
    });

    it('excludes external apps from stopped checked apps', () => {
      const component = spectator.component;
      component.dataSource = apps;

      // Select stopped app
      component.selection.select('ix-test-app-2');

      const stoppedCheckedApps = component.stoppedCheckedApps;

      // Only TrueNAS stopped apps should be included
      expect(stoppedCheckedApps).toHaveLength(1);
      expect(stoppedCheckedApps[0].name).toBe('test-app-2');
      expect(stoppedCheckedApps[0].source).toBe('TRUENAS');
    });
  });

  describe('collapsible sections', () => {
    it('initializes with both sections expanded', () => {
      const component = spectator.component;

      expect(component.truenasAppsExpanded()).toBe(true);
      expect(component.externalAppsExpanded()).toBe(true);
    });

    it('toggles TrueNAS apps section', () => {
      const component = spectator.component;

      component.truenasAppsExpanded.set(false);
      expect(component.truenasAppsExpanded()).toBe(false);

      component.truenasAppsExpanded.set(true);
      expect(component.truenasAppsExpanded()).toBe(true);
    });

    it('toggles external apps section', () => {
      const component = spectator.component;

      component.externalAppsExpanded.set(false);
      expect(component.externalAppsExpanded()).toBe(false);

      component.externalAppsExpanded.set(true);
      expect(component.externalAppsExpanded()).toBe(true);
    });
  });

  describe('totalUtilization$', () => {
    it('aggregates stats from all apps', async () => {
      const component = spectator.component;

      const utilization = await firstValueFrom(component.totalUtilization$);

      expect(utilization.cpu).toBeGreaterThanOrEqual(0);
      expect(utilization.memory).toBeGreaterThanOrEqual(0);
      expect(utilization.blkioRead).toBeGreaterThanOrEqual(0);
      expect(utilization.blkioWrite).toBeGreaterThanOrEqual(0);
      expect(utilization.networkRx).toBeGreaterThanOrEqual(0);
      expect(utilization.networkTx).toBeGreaterThanOrEqual(0);
    });

    it('handles empty apps array by returning zero values', async () => {
      const installedAppsStore = spectator.inject(InstalledAppsStore);
      Object.defineProperty(installedAppsStore, 'installedApps$', {
        get: () => of([]),
      });
      const component = spectator.component;

      const utilization = await firstValueFrom(component.totalUtilization$);

      expect(utilization.cpu).toBe(0);
      expect(utilization.memory).toBe(0);
      expect(utilization.blkioRead).toBe(0);
      expect(utilization.blkioWrite).toBe(0);
      expect(utilization.networkRx).toBe(0);
      expect(utilization.networkTx).toBe(0);
    });

    it('handles null or invalid stats by returning zero for those apps', async () => {
      const appsStatsService = spectator.inject(AppsStatsService);

      jest.spyOn(appsStatsService, 'getStatsForApp').mockImplementation((name) => {
        if (name === 'test-app-1') {
          return of(null as any);
        }
        return of({
          app_name: name,
          cpu_usage: 10,
          memory: 1024,
          blkio: { read: 100, write: 200 },
          networks: [],
        } as AppStats);
      });

      const component = spectator.component;
      const utilization = await firstValueFrom(component.totalUtilization$);

      expect(utilization.cpu).toBe(20);
      expect(utilization.memory).toBe(2048);
    });

    it('aggregates network stats correctly', async () => {
      const appsStatsService = spectator.inject(AppsStatsService);

      jest.spyOn(appsStatsService, 'getStatsForApp').mockReturnValue(of({
        app_name: 'test-app',
        cpu_usage: 5,
        memory: 512,
        blkio: { read: 50, write: 100 },
        networks: [
          { rx_bytes: 1000, tx_bytes: 2000 },
          { rx_bytes: 500, tx_bytes: 1500 },
        ],
      } as AppStats));

      const component = spectator.component;
      const utilization = await firstValueFrom(component.totalUtilization$);

      expect(utilization.networkRx).toBe(4500);
      expect(utilization.networkTx).toBe(10500);
    });

    it('handles null network stats', async () => {
      const appsStatsService = spectator.inject(AppsStatsService);

      jest.spyOn(appsStatsService, 'getStatsForApp').mockReturnValue(of({
        app_name: 'test-app',
        cpu_usage: 5,
        memory: 512,
        blkio: { read: 50, write: 100 },
        networks: null as any,
      } as AppStats));

      const component = spectator.component;
      const utilization = await firstValueFrom(component.totalUtilization$);

      expect(utilization.networkRx).toBe(0);
      expect(utilization.networkTx).toBe(0);
    });

    it('handles undefined values in stats', async () => {
      const appsStatsService = spectator.inject(AppsStatsService);

      jest.spyOn(appsStatsService, 'getStatsForApp').mockReturnValue(of({
        app_name: 'test-app',
        cpu_usage: undefined as any,
        memory: null as any,
        blkio: undefined as any,
        networks: [],
      } as AppStats));

      const component = spectator.component;
      const utilization = await firstValueFrom(component.totalUtilization$);

      expect(utilization.cpu).toBe(0);
      expect(utilization.memory).toBe(0);
      expect(utilization.blkioRead).toBe(0);
      expect(utilization.blkioWrite).toBe(0);
    });
  });
});
