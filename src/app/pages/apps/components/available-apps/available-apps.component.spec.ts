import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { Router } from '@angular/router';
import {
  Spectator, createComponentFactory, createRoutingFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponents, MockDeclaration, MockModule } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppAvailableInfoCardComponent } from 'app/pages/apps/components/app-detail-view/app-available-info-card/app-available-info-card.component';
import { AppDetailViewComponent } from 'app/pages/apps/components/app-detail-view/app-detail-view.component';
import { AppDetailsHeaderComponent } from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import { AppDetailsSimilarComponent } from 'app/pages/apps/components/app-detail-view/app-details-similar/app-details-similar.component';
import { AppResourcesCardComponent } from 'app/pages/apps/components/app-detail-view/app-resources-card/app-resources-card.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import {
  CustomAppButtonComponent,
} from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStatisticsService } from 'app/pages/apps/store/apps-statistics.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { AuthService } from 'app/services/auth/auth.service';

const existingCatalogApp = {
  name: 'webdav',
  versions: {
    ['1.0.9' as string]: {
      healthy: true,
      schema: {
        groups: [
          { name: 'WebDAV Configuration' },
          { name: 'User and Group Configuration' },
          { name: 'Network Configuration' },
          { name: 'Storage Configuration' },
          { name: 'Resources Configuration' },
        ],
        questions: [
          {
            variable: 'webdavConfig',
            group: 'WebDAV Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'authType',
                  label: 'Authentication Type',
                  schema: {
                    type: 'string',
                    default: 'none',
                    enum: [{ value: 'none', description: 'No Authentication' }],
                  },
                },
                {
                  variable: 'username',
                  schema: {
                    type: 'string',
                    show_if: [['authType', '=', 'basic']],
                    required: true,
                  },
                },
              ],
            },
          },
          {
            variable: 'webdavRunAs',
            group: 'User and Group Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'user',
                  label: 'User ID',
                  schema: {
                    type: 'int',
                    default: 666,
                    required: true,
                  },
                },
                {
                  variable: 'group',
                  label: 'Group ID',
                  schema: {
                    type: 'int',
                    default: 666,
                    required: true,
                  },
                },
              ],
            },
          },
          {
            variable: 'webdavNetwork',
            group: 'Network Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'http',
                  label: 'Enable HTTP',
                  schema: {
                    type: 'boolean',
                    default: true,
                    show_subquestions_if: true,
                    subquestions: [
                      {
                        variable: 'httpPort',
                        label: 'HTTP Port',
                        schema: {
                          type: 'int',
                          default: 30034,
                          required: true,
                        },
                      },
                    ],
                  },
                },
                {
                  variable: 'https',
                  label: 'Enable HTTPS',
                  schema: {
                    type: 'boolean',
                    default: false,
                    show_subquestions_if: true,
                    subquestions: [],
                  },
                },
                {
                  variable: 'hostNetwork',
                  label: 'Host Network',
                  schema: {
                    type: 'boolean',
                    default: false,
                  },
                },
              ],
            },
          },
          {
            variable: 'webdavStorage',
            group: 'Storage Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'shares',
                  label: 'Shares',
                  schema: {
                    type: 'list',
                    required: true,
                    default: [],
                    items: [],
                  },
                },
              ],
            },
          },
          {
            variable: 'resources',
            group: 'Resources Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'limits',
                  label: 'Limits',
                  schema: {
                    type: 'dict',
                    attrs: [
                      {
                        variable: 'cpu',
                        label: 'CPU',
                        schema: {
                          type: 'string',
                          default: '4000m',
                          required: true,
                        },
                      },
                      {
                        variable: 'memory',
                        label: 'Memory',
                        schema: {
                          type: 'string',
                          default: '8Gi',
                          required: true,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
  latest_version: '1.0.9',
} as CatalogApp;

const appsResponse = [{
  name: 'webdav',
  catalog: 'TRUENAS',
  train: 'community',
  description: 'webdav',
  app_readme: '<h1>WebDAV</h1>\n<p> When application ...</p>',
  last_update: { $date: 452 },
}] as AvailableApp[];

describe('Finding app', () => {
  let spectator: Spectator<AvailableAppsComponent>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;

  const createComponent = createComponentFactory({
    component: AvailableAppsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      MockModule(PageHeaderModule),
      OrNotAvailablePipe,
    ],
    declarations: [
      AvailableAppsHeaderComponent,
      AppCardComponent,
      AppCardLogoComponent,
      MockDeclaration(CustomAppButtonComponent),
    ],
    providers: [
      DockerStore,
      InstalledAppsStore,
      mockProvider(AppsStatisticsService),
      mockWebSocket([]),
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([]),
        catalogs$: of([]),
      }),
      mockProvider(AppsFilterStore, {
        isFilterApplied$: of(false),
        filterValues$: of({}),
        applySearchQuery: jest.fn(),
        searchedApps$: of([{ apps: appsResponse }]),
        searchQuery$: of('webdav'),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    searchInput = await loader.getHarness(MatInputHarness.with({ placeholder: 'Search' }));
  });

  it('find app', async () => {
    await searchInput.setValue('webdav');
    expect(spectator.inject(AppsFilterStore).applySearchQuery).toHaveBeenLastCalledWith('webdav');

    expect(spectator.query('.section-title').textContent.trim()).toBe('Search Results for «webdav»');
  });

  it('redirect to details app when app card is pressed', () => {
    const href = spectator.query('ix-app-card').getAttribute('ng-reflect-router-link').replace(/,/g, '/');
    const appPath = '/apps/available/TRUENAS/community/webdav';
    expect(appPath.startsWith(href)).toBeTruthy();
  });
});

describe('Redirect to install app', () => {
  let spectator: Spectator<AppDetailViewComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: AppDetailViewComponent,
    imports: [
      NgxSkeletonLoaderModule,
      MockModule(PageHeaderModule),
      OrNotAvailablePipe,
    ],
    declarations: [
      AppDetailsHeaderComponent,
      MockComponents(
        AppResourcesCardComponent,
        AppAvailableInfoCardComponent,
        AppCardLogoComponent,
        AppDetailsSimilarComponent,
      ),
    ],
    providers: [
      InstalledAppsStore,
      mockProvider(AppsStatisticsService),
      mockWebSocket([
        mockJob('chart.release.create'),
        mockJob('chart.release.update'),
        mockCall('catalog.get_app_details', existingCatalogApp),
        mockCall('chart.release.query', [{} as ChartRelease]),
        mockCall('service.started', true),
      ]),
      mockProvider(AuthService, {
        user$: of({ attributes: { appsAgreement: true } }),
        hasRole: () => of(true),
      }),
      mockProvider(AppsStore, {
        availableApps$: of(appsResponse),
        isLoading$: of(false),
      }),
      mockProvider(DockerStore, {
        selectedPool$: of('pool'),
      }),
    ],
    params: { appId: 'webdav', catalog: 'TRUENAS', train: 'community' },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('redirect to install app when Install button is pressed', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
    await saveButton.click();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'available', 'TRUENAS', 'community', 'webdav', 'install']);
  });
});
