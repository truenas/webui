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
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartFormValue, ChartRelease } from 'app/interfaces/chart-release.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
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
          {
            name: 'WebDAV Configuration',
            description: 'Configure WebDAV',
          },
          {
            name: 'User and Group Configuration',
            description: 'Configure User and Group for WebDAV',
          },
          {
            name: 'Network Configuration',
            description: 'Configure Network for WebDAV',
          },
          {
            name: 'Storage Configuration',
            description: 'Configure Storage for WebDAV',
          },
          {
            name: 'Resources Configuration',
            description: 'Configure Resources for WebDAV',
          },
        ],
        questions: [
          {
            variable: 'webdavConfig',
            label: '',
            group: 'WebDAV Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'authType',
                  label: 'Authentication Type',
                  description: 'Select the authentication type for WebDAV.',
                  schema: {
                    type: 'string',
                    default: 'none',
                    enum: [
                      {
                        value: 'none',
                        description: 'No Authentication',
                      },
                      {
                        value: 'basic',
                        description: 'Basic Authentication',
                      },
                    ],
                  },
                },
                {
                  variable: 'username',
                  label: 'Username',
                  description: 'The username for basic authentication.',
                  schema: {
                    type: 'string',
                    show_if: [
                      [
                        'authType',
                        '=',
                        'basic',
                      ],
                    ],
                    required: true,
                  },
                },
                {
                  variable: 'password',
                  label: 'Password',
                  description: 'The password for basic authentication.',
                  schema: {
                    type: 'string',
                    show_if: [
                      [
                        'authType',
                        '=',
                        'basic',
                      ],
                    ],
                    private: true,
                    required: true,
                  },
                },
                {
                  variable: 'additionalEnvs',
                  label: 'Additional Environment Variables',
                  description: 'Configure additional environment variables for WebDAV.',
                  schema: {
                    type: 'list',
                    default: [],
                    items: [
                      {
                        variable: 'env',
                        label: 'Environment Variable',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'name',
                              label: 'Name',
                              schema: {
                                type: 'string',
                                required: true,
                              },
                            },
                            {
                              variable: 'value',
                              label: 'Value',
                              schema: {
                                type: 'string',
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
          {
            variable: 'webdavRunAs',
            label: '',
            group: 'User and Group Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'user',
                  label: 'User ID',
                  description: 'The user id that WebDAV will run as.',
                  schema: {
                    type: 'int',
                    min: 2,
                    default: 666,
                    required: true,
                  },
                },
                {
                  variable: 'group',
                  label: 'Group ID',
                  description: 'The group id that WebDAV will run as.',
                  schema: {
                    type: 'int',
                    min: 2,
                    default: 666,
                    required: true,
                  },
                },
              ],
            },
          },
          {
            variable: 'webdavNetwork',
            label: '',
            group: 'Network Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'http',
                  label: 'Enable HTTP',
                  description: 'Enable HTTP for WebDAV.',
                  schema: {
                    type: 'boolean',
                    default: true,
                    show_subquestions_if: true,
                    subquestions: [
                      {
                        variable: 'httpPort',
                        label: 'HTTP Port',
                        description: 'The port for HTTP WebDAV.',
                        schema: {
                          type: 'int',
                          default: 30034,
                          min: 9000,
                          max: 65535,
                          required: true,
                        },
                      },
                    ],
                  },
                },
                {
                  variable: 'https',
                  label: 'Enable HTTPS',
                  description: 'Enable HTTPS for WebDAV.',
                  schema: {
                    type: 'boolean',
                    default: false,
                    show_subquestions_if: true,
                    subquestions: [
                      {
                        variable: 'httpsPort',
                        label: 'HTTPS Port',
                        description: 'The port for HTTPS WebDAV.',
                        schema: {
                          type: 'int',
                          default: 30035,
                          min: 9000,
                          max: 65535,
                          required: true,
                        },
                      },
                      {
                        variable: 'certificateID',
                        label: 'Certificate',
                        description: 'The certificate to use for HTTPS WebDAV.',
                        schema: {
                          type: 'int',
                          null: true,
                          $ref: [
                            'definitions/certificate',
                          ],
                          enum: [
                            {
                              value: null,
                              description: 'No Certificate',
                            },
                            {
                              value: 1,
                              description: "'truenas_default' Certificate",
                            },
                          ],
                          default: null,
                        },
                      },
                    ],
                  },
                },
                {
                  variable: 'hostNetwork',
                  label: 'Host Network',
                  description: "Bind to the host network. It's recommended to keep this disabled.</br>\n",
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
            label: '',
            group: 'Storage Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'shares',
                  label: 'Shares',
                  description: 'Shares for WebDAV.',
                  schema: {
                    type: 'list',
                    empty: false,
                    required: true,
                    default: [],
                    items: [
                      {
                        variable: 'shareEntry',
                        label: 'Share Entry',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'enabled',
                              label: 'Enable the share',
                              description: 'Enable the share.',
                              schema: {
                                type: 'boolean',
                                default: true,
                              },
                            },
                            {
                              variable: 'name',
                              label: 'Share Name',
                              description: 'The name of the share.</br>\nAlso serves as the endpoint for the share.</br>\nExample: [share1] will be available at [http://<webdav-ip>:<webdav-port>/share1]\n',
                              schema: {
                                type: 'string',
                                valid_chars: '^[a-zA-Z0-9_-]+$',
                                valid_chars_error: 'Share name can only consist of [Letters(a-z, A-Z), Numbers(0-9), Underscores(_), Dashes(-)]',
                                required: true,
                              },
                            },
                            {
                              variable: 'description',
                              label: 'Description',
                              description: 'Share description. Only used for documentation.',
                              schema: {
                                type: 'string',
                              },
                            },
                            {
                              variable: 'hostPath',
                              label: 'Host Path',
                              description: 'The host path to use for the share.',
                              schema: {
                                type: 'hostpath',
                                required: true,
                              },
                            },
                            {
                              variable: 'readOnly',
                              label: 'Read Only',
                              description: 'Enable read only access to the share.</br>\nThis will disable write access to the share.</br>\nData will be mounted as read only.\n',
                              schema: {
                                type: 'boolean',
                                default: false,
                              },
                            },
                            {
                              variable: 'fixPermissions',
                              label: 'Fix Permissions',
                              description: 'Enable permission fix for the share.</br>\nThis will fix the permissions of the share on startup.</br>\nThis will change the owner of the share to the user and group specified in [User and Group Configuration].</br>\nNote: This will still change permissions even if [Read Only] for the share is enabled.\n',
                              schema: {
                                type: 'boolean',
                                default: false,
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
          {
            variable: 'resources',
            group: 'Resources Configuration',
            label: '',
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
                        description: 'CPU limit for WebDAV.',
                        schema: {
                          type: 'string',
                          max_length: 6,
                          valid_chars: '^(0\\.[1-9]|[1-9][0-9]*)(\\.[0-9]|m?)$',
                          valid_chars_error: 'Valid CPU limit formats are</br>\n- Plain Integer - eg. 1</br>\n- Float - eg. 0.5</br>\n- Milicpu - eg. 500m\n',
                          default: '4000m',
                          required: true,
                        },
                      },
                      {
                        variable: 'memory',
                        label: 'Memory',
                        description: 'Memory limit for WebDAV.',
                        schema: {
                          type: 'string',
                          max_length: 12,
                          valid_chars: '^[1-9][0-9]*([EPTGMK]i?|e[0-9]+)?$',
                          valid_chars_error: 'Valid Memory limit formats are</br>\n- Suffixed with E/P/T/G/M/K - eg. 1G</br>\n- Suffixed with Ei/Pi/Ti/Gi/Mi/Ki - eg. 1Gi</br>\n- Plain Integer in bytes - eg. 1024</br>\n- Exponent - eg. 134e6\n',
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
      app_readme: '<h1>WebDAV</h1>\n<p> When application is installed and is selected on at least 1 share\na container will be launched with <strong>root</strong> privileges. This is required in order to apply\nthe correct permissions to the <code>WebDAV</code> shares/directories.\nAfterward, the <code>WebDAV</code> container will run as a <strong>non</strong>-root user (Default: <code>666</code>).\n<code>Chown</code> will only apply if the parent directory does not match the configured user and group.</p>\n</blockquote>',
      detailed_readme: '<h1>WebDAV</h1>\n<p><a href="http://webdav.org/">WebDAV</a> is a set of extensions to the HTTP protocol which allows users to collaboratively edit and manage files on remote web servers.</p>\n<blockquote>\n<p>When application is installed and <code>Fix Permissions</code> is selected on at least 1 share\na container will be launched with <strong>root</strong> privileges. This is required in order to apply\nthe correct permissions to the selected <code>WebDAV</code> shares/directories.\nAfterward, the <code>WebDAV</code> container will run as a <strong>non</strong>-root user (Default: <code>666</code>).\nNote that <code>chown</code> will only apply if the parent directory does not match the configured user and group.</p>\n</blockquote>',
      changelog: null,
    },
  },
  latest_version: '1.0.9',
} as CatalogApp;

const existingChartEdit = {
  name: 'tftpd-hpa',
  id: 'tftpd-hpa',
  config: {
    TZ: 'America/Los_Angeles',
    global: {
      ixChartContext: {
        addNvidiaRuntimeClass: false,
        isInstall: true,
        isUpdate: false,
        isUpgrade: false,
        kubernetes_config: {
          cluster_cidr: '172.16.0.0/16',
          cluster_dns_ip: '172.17.0.10',
          service_cidr: '172.17.0.0/16',
        },
        nvidiaRuntimeClassName: 'nvidia',
        operation: 'INSTALL',
        storageClassName: 'ix-storage-class-tftpd-hpa',
        upgradeMetadata: {},
      },
    },
    image: {
      pullPolicy: 'IfNotPresent',
      repository: 'ixsystems/tftpd-hpa',
      tag: '1.0.0',
    },
    ixCertificateAuthorities: {},
    ixCertificates: {},
    ixChartContext: {
      addNvidiaRuntimeClass: false,
      isInstall: true,
      isUpdate: false,
      isUpgrade: false,
      kubernetes_config: {
        cluster_cidr: '172.16.0.0/16',
        cluster_dns_ip: '172.17.0.10',
        service_cidr: '172.17.0.0/16',
      },
      nvidiaRuntimeClassName: 'nvidia',
      operation: 'INSTALL',
      storageClassName: 'ix-storage-class-tftpd-hpa',
      upgradeMetadata: {},
    },
    ixExternalInterfacesConfiguration: [],
    ixExternalInterfacesConfigurationNames: [],
    ixVolumes: [
      {
        hostPath: '/mnt/my pool/ix-applications/releases/tftpd-hpa/volumes/ix_volumes/tftpboot',
      },
    ],
    release_name: 'tftpd-hpa',
    resources: {
      limits: {
        cpu: '4000m',
        memory: '8Gi',
      },
    },
    tftpConfig: {
      additionalEnvs: [],
      allowCreate: false,
    },
    tftpNetwork: {
      hostNetwork: true,
      tftpPort: 30031,
    },
    tftpStorage: {
      tftpboot: {
        datasetName: 'tftpboot',
        type: 'ixVolume',
      },
    },
  } as { [key: string]: ChartFormValue },
} as ChartRelease;

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
    ],
    declarations: [
      AvailableAppsHeaderComponent,
      AppCardComponent,
      AppCardLogoComponent,
    ],
    providers: [
      KubernetesStore,
      InstalledAppsStore,
      mockWebsocket([]),
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
      mockWebsocket([
        mockJob('chart.release.create'),
        mockJob('chart.release.update'),
        mockCall('catalog.get_item_details', existingCatalogApp),
        mockCall('chart.release.query', [existingChartEdit]),
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

describe('Install app', () => {
  let spectator: Spectator<ChartWizardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ChartWizardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      IxDynamicFormModule,
    ],
    providers: [
      KubernetesStore,
      mockWebsocket([
        mockJob('chart.release.create'),
        mockJob('chart.release.update'),
        mockCall('catalog.get_item_details', existingCatalogApp),
        mockCall('chart.release.query', [existingChartEdit]),
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
      'chart.release.create', [{
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
            additionalEnvs: [],
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
