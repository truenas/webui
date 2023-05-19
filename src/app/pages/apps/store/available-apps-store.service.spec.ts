import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsByCategory, AvailableAppsState, AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

describe('AvailableAppsStore', () => {
  let spectator: SpectatorService<AvailableAppsStore>;
  let testScheduler: TestScheduler;

  const initialState: AvailableAppsState = {
    availableApps: [],
    recommendedApps: [],
    latestApps: [],
    categories: [],
    filteredApps: [],
    isLoading: false,
    isFilterApplied: false,
    filter: {
      categories: [],
      sort: null,
      catalogs: [],
    },
    searchQuery: '',
    installedApps: [],
    selectedPool: null,
    isKubernetesStarted: false,
  };

  const installedChartReleases: ChartRelease[] = [
    {
      name: 'minio',
      info: {
        first_deployed: '2023-04-18T08:52:43.28333885-04:00',
        last_deployed: '2023-05-12T13:41:30.027014679-04:00',
        deleted: '',
        description: 'Upgrade complete',
        status: 'deployed',
        notes: '\n# Welcome to TrueNAS SCALE\nThank you for installing MinIO App.\n\n\n# Documentation\nDocumentation for this app can be found at https://docs.ixsystems.com.\n# Bug reports\nIf you find a bug in this app, please file an issue at https://jira.ixsystems.com\n\n',
      },
      config: {
        enableMultiMode: false,
        global: {
          ixChartContext: {
            addNvidiaRuntimeClass: false,
            isInstall: false,
            isUpdate: false,
            isUpgrade: true,
            kubernetes_config: {
              cluster_cidr: '172.16.0.0/16',
              cluster_dns_ip: '172.17.0.10',
              service_cidr: '172.17.0.0/16',
            },
            nvidiaRuntimeClassName: 'nvidia',
            operation: 'UPGRADE',
            storageClassName: 'ix-storage-class-minio',
            upgradeMetadata: {
              newChartVersion: '1.0.8',
              oldChartVersion: '1.0.6',
              preUpgradeRevision: 14,
            },
          },
        },
        image: {
          pullPolicy: 'IfNotPresent',
          repository: 'minio/minio',
          tag: 'RELEASE.2023-03-24T21-41-23Z',
        },
        ixCertificateAuthorities: {},
        ixCertificates: {},
        ixChartContext: {
          addNvidiaRuntimeClass: false,
          isInstall: false,
          isUpdate: false,
          isUpgrade: true,
          kubernetes_config: {
            cluster_cidr: '172.16.0.0/16',
            cluster_dns_ip: '172.17.0.10',
            service_cidr: '172.17.0.0/16',
          },
          nvidiaRuntimeClassName: 'nvidia',
          operation: 'UPGRADE',
          storageClassName: 'ix-storage-class-minio',
          upgradeMetadata: {
            newChartVersion: '1.0.8',
            oldChartVersion: '1.0.6',
            preUpgradeRevision: 14,
          },
        },
        ixExternalInterfacesConfiguration: [],
        ixExternalInterfacesConfigurationNames: [],
        ixVolumes: [
          { hostPath: '/mnt/new/ix-applications/releases/minio/volumes/ix_volumes/data1' },
          { hostPath: '/mnt/new/ix-applications/releases/minio/volumes/ix_volumes/postgres-data' },
          { hostPath: '/mnt/new/ix-applications/releases/minio/volumes/ix_volumes/postgres-backup' },
        ],
        logsearchImage: {
          pullPolicy: 'IfNotPresent',
          repository: 'minio/operator',
          tag: 'v4.5.8',
        },
        minioCreds: {
          rootPass: 'test1234',
          rootUser: 'test1234',
        },
        minioLogging: {
          anonymous: false,
          logsearch: {
            diskCapacityGB: 5,
            enabled: false,
            pgBackup: {
              datasetName: 'postgres-backup',
              hostPath: '.',
              type: 'ixVolume',
            },
            pgData: {
              datasetName: 'postgres-data',
              hostPath: '.',
              type: 'ixVolume',
            },
          },
          quiet: false,
        },
        minioMultiMode: [],
        minioNetwork: {
          apiPort: 30005,
          certificateID: null,
          consoleUrl: '',
          hostNetwork: false,
          serverUrl: '',
          webPort: 30006,
        },
        minioRunAs: {
          group: 568,
          user: 568,
        },
        minioStorage: [
          {
            datasetName: 'data1',
            mountPath: '/data1',
            type: 'ixVolume',
          },
        ],
        release_name: 'minio',
        resources: {
          limits: {
            cpu: '4000m',
            memory: '8Gi',
          },
        },
      },
      version: 15,
      namespace: 'ix-minio',
      chart_metadata: {
        name: 'minio',
        home: 'https://min.io',
        sources: [
          'https://github.com/minio/minio',
          'https://github.com/truenas/charts/tree/master/enterprise/minio',
        ],
        version: '1.0.8',
        description: 'High Performance, Kubernetes Native Object Storage',
        keywords: ['storage', 'object-storage', 'S3'],
        maintainers: [
          {
            name: 'truenas',
            email: 'dev@ixsystems.com',
            url: 'https://www.truenas.com/',
          },
        ],
        icon: 'https://min.io/resources/img/logo/MINIO_wordmark.png',
        apiVersion: 'v2',
        appVersion: '2023-03-24',
        annotations: {
          title: 'MinIO',
        },
        kubeVersion: '>=1.16.0-0',
        dependencies: [
          {
            name: 'common',
            version: '1.0.7',
            repository: 'file://../../../common',
            enabled: true,
          },
        ],
        type: 'application',
        latest_chart_version: '1.0.8',
      },
      id: 'minio',
      catalog: 'OFFICIAL',
      catalog_train: 'enterprise',
      path: '/mnt/new/ix-applications/releases/minio',
      dataset: 'new/ix-applications/releases/minio',
      status: ChartReleaseStatus.Deploying,
      used_ports: [
        { port: 30005, protocol: 'TCP' },
        { port: 30006, protocol: 'TCP' },
      ],
      pod_status: {
        desired: 1,
        available: 0,
      },
      update_available: false,
      human_version: '2023-03-24_1.0.8',
      human_latest_version: '2023-03-24_1.0.8',
      container_images_update_available: false,
      portals: {
        web_portal: ['http://10.220.16.82:30006/'],
      },
    } as unknown as ChartRelease,
  ];

  const installedAndRecommendedApp: AvailableApp = {
    catalog: 'OFFICIAL',
    installed: true,
    train: 'charts',
    app_readme: '<h1>Syncthing</h1>',
    categories: ['storage'],
    description: 'Syncthing is a continuous file synchronization program.',
    healthy: true,
    healthy_error: null,
    home: 'syncthing.net',
    location: '/tmp/syncthing',
    latest_version: '1.0.27',
    latest_app_version: '1.23.4',
    latest_human_version: '1.23.4_1.0.27',
    last_update: { $date: 1683822035000 },
    name: 'syncthing',
    recommended: true,
    title: 'Syncthing',
    maintainers: [
      {
        name: 'truenas',
        url: 'truenas.com',
        email: 'dev@ixsystems.com',
      },
    ],
    tags: ['backup', 'sync', 'file-sharing'],
    screenshots: ['sc1', 'sc2'],
    sources: [
      'syncthing.net',
      'github.com',
    ],
    icon_url: 'icon.url',
    versions: {},
  };
  const plexApp: AvailableApp = {
    catalog: 'OFFICIAL',
    installed: false,
    train: 'charts',
    app_readme: '<h1>Plex</h1>',
    categories: ['media'],
    description: 'Plex is an app',
    healthy: true,
    healthy_error: null,
    home: 'plex.net',
    location: '/tmp/plex',
    latest_version: '1.0.2',
    latest_app_version: '1.1.4',
    latest_human_version: '1.1.4_1.0.2',
    last_update: { $date: 1683822036000 },
    name: 'plex',
    recommended: false,
    title: 'Plex',
    maintainers: [
      {
        name: 'truenas',
        url: 'truenas.com',
        email: 'dev@ixsystems.com',
      },
    ],
    tags: ['backup', 'media', 'file-sharing'],
    screenshots: ['sc1', 'sc2'],
    sources: [
      'plex.net',
      'github.com',
    ],
    icon_url: 'icon.url',
    versions: {},
  };
  const availableApps: AvailableApp[] = [
    { ...plexApp },
    { ...installedAndRecommendedApp },
  ];

  const createService = createServiceFactory({
    service: AvailableAppsStore,
    providers: [
      mockProvider(DialogService, {
        error: jest.fn(),
      }),
      mockProvider(ErrorHandlerService, {
        parseWsError: jest.fn(),
      }),
      mockProvider(ApplicationsService, {
        getAvailableApps: jest.fn(() => of(availableApps)) as () => Observable<AvailableApp[]>,
        getLatestApps: jest.fn(() => of([{ ...installedAndRecommendedApp }])) as () => Observable<AvailableApp[]>,
        subscribeToAllChartReleases: jest.fn(() => of()) as () => Observable<ApiEvent<ChartRelease>>,
        getAllAppsCategories: jest.fn(() => of(['storage', 'media'])) as () => Observable<string[]>,
        getKubernetesConfig: jest.fn(() => {
          return of({ pool: 'ix-applications-pool' } as KubernetesConfig);
        }) as () => Observable<KubernetesConfig>,
        getKubernetesServiceStarted: jest.fn(() => of(true)) as () => Observable<boolean>,
        getAllChartReleases: jest.fn(() => {
          return of([
            ...installedChartReleases,
          ] as ChartRelease[]);
        }) as () => Observable<ChartRelease[]>,
        convertDateToRelativeDate: jest.fn(() => ''),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.initialize();
    testScheduler = getTestScheduler();
  });

  it('initializes the correct state', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.state$).toBe('b', {
        b: {
          ...initialState,
          availableApps: [...availableApps],
          categories: [
            'storage', 'media',
          ],
          installedApps: [...installedChartReleases],
          isKubernetesStarted: true,
          selectedPool: 'ix-applications-pool',
          latestApps: [{ ...installedAndRecommendedApp }],
          recommendedApps: [{ ...installedAndRecommendedApp, categories: ['storage', 'Recommended'] }],
          filteredApps: [],

        } as AvailableAppsState,
      });
    });
  });

  it('returns the correct searched apps from string', () => {
    spectator.service.applySearchQuery('plex');
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.searchedApps$).toBe('b', {
        b: [
          {
            apps: [],
            category: AppExtraCategory.NewAndUpdated,
            title: 'New & Updated Apps',
            totalApps: 0,
          },
          {
            apps: [],
            category: AppExtraCategory.Recommended,
            title: 'Recommended Apps',
            totalApps: 0,
          },
          {
            apps: [],
            category: 'storage',
            title: 'storage',
            totalApps: 0,
          },
          {
            apps: [{ ...plexApp }],
            category: 'media',
            title: 'media',
            totalApps: 1,
          },
        ],
      });
    });
  });

  it('returns the correct searched apps with the name sorting', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        catalogs: [],
        categories: ['media'],
        sort: AppsFiltersSort.Name,
      });
      expectObservable(spectator.service.searchedApps$).toBe('a', {
        a: [
          {
            title: 'P',
            category: 'P',
            totalApps: 1,
            apps: [{ ...plexApp }],
          },
          {
            title: 'S',
            category: 'S',
            totalApps: 1,
            apps: [{ ...installedAndRecommendedApp }],
          },
        ] as AppsByCategory[],
      });
    });
  });
  it('returns the correct searched apps with the catalog sorting', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        catalogs: [],
        categories: ['media'],
        sort: AppsFiltersSort.Catalog,
      });
      expectObservable(spectator.service.searchedApps$).toBe('b', {
        b: [{
          category: 'OFFICIAL',
          title: 'OFFICIAL',
          totalApps: 2,
          apps: [...availableApps],
        }],
      });
    });
  });
  it('returns the correct searched apps with the update sorting', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        catalogs: [],
        categories: ['media'],
        sort: AppsFiltersSort.LastUpdate,
      });
      expectObservable(spectator.service.searchedApps$).toBe('b', {
        b: [{
          category: '',
          title: '',
          totalApps: 2,
          apps: [...availableApps],
        }],
      });
    });
  });
});
