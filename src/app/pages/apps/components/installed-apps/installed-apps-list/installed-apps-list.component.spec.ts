import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockDeclaration } from 'ng-mocks';
import { ImgFallbackDirective } from 'ngx-img-fallback';
import { NgxPopperjsContentComponent, NgxPopperjsDirective, NgxPopperjsLooseDirective } from 'ngx-popperjs';
import { of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { AppDeleteDialogComponent } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { InstalledAppsListComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ApiService } from 'app/services/websocket/api.service';

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

describe('InstalledAppsListComponent', () => {
  let spectator: Spectator<InstalledAppsListComponent>;
  let applicationsService: ApplicationsService;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
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
      SearchInput1Component,
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
      mockProvider(Router, {
        events: of(),
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
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: () => 'unknown_id',
            },
          },
        },
      },
      mockApi([
        mockJob('core.bulk'),
      ]),
      mockAuth(),
      mockProvider(AppsStatsService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    applicationsService = spectator.inject(ApplicationsService);
  });

  it('shows a list of apps', () => {
    const appRows = spectator.queryAll(AppRowComponent);

    expect(appRows).toHaveLength(2);
    expect(appRows[0].app()).toEqual(apps[0]);
    expect(appRows[1].app()).toEqual(apps[1]);
  });

  it('shows an empty list when there are no search results', () => {
    expect(spectator.query(EmptyComponent)).not.toExist();

    spectator.query(SearchInput1Component).search.emit('test-app-3');
    spectator.detectChanges();

    const appRows = spectator.queryAll(AppRowComponent);
    expect(appRows).toHaveLength(0);

    expect(spectator.query(EmptyComponent)).toExist();
  });

  it('shows details', () => {
    spectator.click(spectator.query('ix-app-row'));
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
      '/apps/installed', 'test-catalog-train', 'ix-test-app-1',
    ]);
  });

  it('starts application', () => {
    spectator.query(AppRowComponent).startApp.emit();
    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('stops application', () => {
    spectator.query(AppRowComponent).stopApp.emit();
    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('restarts application', () => {
    spectator.query(AppRowComponent).restartApp.emit();
    expect(applicationsService.restartApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('starts sereral applications', async () => {
    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent).bulkStart.emit();

    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app-2');
  });

  it('stops sereral applications', async () => {
    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent).bulkStop.emit();

    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app-1');
  });

  it('upgrades sereral applications', async () => {
    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent).bulkUpgrade.emit();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppBulkUpgradeComponent, { data: apps });
  });

  it('removes sereral applications', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of({ removeVolumes: true, removeImages: true }),
    } as MatDialogRef<unknown>);

    const selectAll = await loader.getHarness(MatCheckboxHarness.with({ selector: '[ixTest="select-all-app"]' }));
    await selectAll.check();
    spectator.query(InstalledAppsListBulkActionsComponent).bulkDelete.emit();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppDeleteDialogComponent, {
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
});
