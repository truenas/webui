import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
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
import { AppDeleteDialogComponent } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ApiService } from 'app/services/websocket/api.service';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('InstalledAppsComponent', () => {
  let spectator: Spectator<InstalledAppsComponent>;
  let loader: HarnessLoader;
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.component.dataSource = [app];
    applicationsService = spectator.inject(ApplicationsService);
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
    expect(applicationsService.startApplication).toHaveBeenCalledWith('test-app');
  });

  it('stops application', () => {
    spectator.query(AppRowComponent).stopApp.emit();
    expect(applicationsService.stopApplication).toHaveBeenCalledWith('test-app');
  });

  it('restarts application', () => {
    spectator.query(AppRowComponent).restartApp.emit();
    expect(applicationsService.restartApplication).toHaveBeenCalledWith('test-app');
  });

  it('removes selected applications', async () => {
    jest.spyOn(applicationsService, 'checkIfAppIxVolumeExists').mockReturnValue(of(true));
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of({ removeVolumes: true, removeImages: true }),
    } as MatDialogRef<unknown>);

    spectator.component.selection.select(app.name);

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Select action' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete All Selected' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      AppDeleteDialogComponent,
      { data: { name: 'test-app', showRemoveVolumes: true } },
    );

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'core.bulk',
      ['app.delete', [[app.name, { remove_images: true, remove_ix_volumes: true }]]],
    );
  });
});
