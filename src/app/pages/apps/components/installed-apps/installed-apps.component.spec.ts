import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Spectator, createComponentFactory, createRoutingFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponents, MockDeclaration, MockModule } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppAvailableInfoCardComponent } from 'app/pages/apps/components/app-detail-view/app-available-info-card/app-available-info-card.component';
import { AppDetailViewComponent } from 'app/pages/apps/components/app-detail-view/app-detail-view.component';
import { AppDetailsHeaderComponent } from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import { AppDetailsSimilarComponent } from 'app/pages/apps/components/app-detail-view/app-details-similar/app-details-similar.component';
import { AppHelmChartCardComponent } from 'app/pages/apps/components/app-detail-view/app-helm-chart-card/app-helm-chart-card.component';
import { AppResourcesCardComponent } from 'app/pages/apps/components/app-detail-view/app-resources-card/app-resources-card.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import {
  CustomAppButtonComponent,
} from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { AppCatalogPipe } from 'app/pages/apps/utils/app-catalog.pipe';
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
      AppCatalogPipe,
      MockModule(PageHeaderModule),
    ],
    declarations: [
      AvailableAppsHeaderComponent,
      AppCardComponent,
      AppCardLogoComponent,
      MockDeclaration(CustomAppButtonComponent),
    ],
    providers: [
      KubernetesStore,
      InstalledAppsStore,
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
      AppCatalogPipe,
      MockModule(PageHeaderModule),
    ],
    declarations: [
      AppDetailsHeaderComponent,
      MockComponents(
        AppResourcesCardComponent,
        AppAvailableInfoCardComponent,
        AppHelmChartCardComponent,
        AppCardLogoComponent,
        AppDetailsSimilarComponent,
      ),
    ],
    providers: [
      KubernetesStore,
      InstalledAppsStore,
      mockWebSocket([
        mockJob('chart.release.create'),
        mockJob('chart.release.update'),
        mockCall('catalog.get_item_details', existingCatalogApp),
        mockCall('chart.release.query', [{} as ChartRelease]),
        mockCall('service.started', true),
        mockCall('kubernetes.config', {
          pool: 'my pool',
          node_ip: '10.123.45.67',
          route_v4_interface: 'enp0s7',
          route_v4_gateway: '10.123.45.1',
          configure_gpus: true,
          servicelb: true,
          cluster_cidr: '172.16.0.0/16',
          service_cidr: '172.17.0.0/16',
          cluster_dns_ip: '172.17.0.1',
        } as KubernetesConfig),
      ]),
      mockProvider(AuthService, {
        user$: of({ attributes: { appsAgreement: true } }),
        hasRole: () => of(true),
      }),
      mockProvider(AppsStore, {
        availableApps$: of(appsResponse),
        isLoading$: of(false),
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

// TODO: Why is this here?
describe('Install app', () => {
  let spectator: Spectator<ChartWizardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ChartWizardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      IxDynamicFormModule,
      MockModule(PageHeaderModule),
    ],
    providers: [
      KubernetesStore,
      mockWebSocket([
        mockJob('chart.release.create'),
        mockJob('chart.release.update'),
        mockCall('catalog.get_item_details', existingCatalogApp),
        mockCall('chart.release.query', [{} as ChartRelease]),
        mockCall('service.started', true),
        mockCall('kubernetes.config', {
          pool: 'my pool',
          node_ip: '10.123.45.67',
          route_v4_interface: 'enp0s7',
          route_v4_gateway: '10.123.45.1',
          configure_gpus: true,
          servicelb: true,
          cluster_cidr: '172.16.0.0/16',
          service_cidr: '172.17.0.0/16',
          cluster_dns_ip: '172.17.0.1',
        } as KubernetesConfig),
        mockCall('container.image.dockerhub_rate_limit', {
          total_pull_limit: 13,
          total_time_limit_in_secs: 21600,
          remaining_pull_limit: 3,
          remaining_time_limit_in_secs: 21600,
          error: null,
        }),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      {
        provide: ActivatedRoute,
        useValue: {
          parent: { params: of({ appId: 'webdav', catalog: 'TRUENAS', train: 'community' }) },
          routeConfig: { path: 'install' },
        },
      },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows values for app when form is opened for create', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Application Name': 'webdav',
      'Authentication Type': 'No Authentication',
      CPU: '4000m',
      'Enable HTTP': true,
      'Enable HTTPS': false,
      'Group ID': '666',
      'HTTP Port': '30034',
      'Host Network': false,
      Memory: '8Gi',
      'User ID': '666',
      Version: '1.0.9',
    });
  });

  it('creating when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Application Name': 'appname',
    });

    const values = await form.getValues();

    expect(values).toEqual({
      'Application Name': 'appname',
      'Authentication Type': 'No Authentication',
      CPU: '4000m',
      'Enable HTTP': true,
      'Enable HTTPS': false,
      'Group ID': '666',
      'HTTP Port': '30034',
      'Host Network': false,
      Memory: '8Gi',
      'User ID': '666',
      Version: '1.0.9',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
    await saveButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'chart.release.create',
      [{
        catalog: 'TRUENAS',
        item: 'webdav',
        release_name: 'appname',
        train: 'community',
        values: {
          release_name: 'appname',
          resources: {
            limits: {
              cpu: '4000m',
              memory: '8Gi',
            },
          },
          webdavConfig: {
            authType: 'none',
          },
          webdavNetwork: {
            hostNetwork: false,
            http: true,
            httpPort: 30034,
            https: false,
          },
          webdavRunAs: {
            group: 666,
            user: 666,
          },
          webdavStorage: {
            shares: [],
          },
        },
        version: '1.0.9',
      }],
    );
    expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
  });
});
