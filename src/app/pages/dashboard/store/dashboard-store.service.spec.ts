import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DashboardNetworkInterface } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { DashboardStorageStore } from 'app/pages/dashboard/store/dashboard-storage-store.service';
import { DashboardStore } from 'app/pages/dashboard/store/dashboard-store.service';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';
import { selectSystemInfo, selectSystemFeatures } from 'app/store/system-info/system-info.selectors';

const mockDatasets = [
  {
    name: 'APPS',
    id: 'dataset_id1',
    used: { parsed: 1024 },
    available: { parsed: 1024 },
  },
  {
    name: 'POOL',
    id: 'dataset_id2',
    used: { parsed: 512 },
    available: { parsed: 1024 },
  },
] as Dataset[];

describe('DashboardStoreService', () => {
  let spectator: SpectatorService<DashboardStore>;
  let testScheduler: TestScheduler;

  const createService = createServiceFactory({
    service: DashboardStore,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectPreferencesState,
            value: {
              areLoaded: true,
              preferences: {
                timeFormat: 'timeFormat',
              },
              dashboardState: [],
            } as PreferencesState,
          },
          {
            selector: selectSystemInfo,
            value: {
              cores: 6,
            } as SystemInfo,
          },
          {
            selector: selectSystemFeatures,
            value: {
              enclosure: true,
            },
          },
          {
            selector: selectIsHaLicensed,
            value: false,
          },
        ],
      }),
      mockProvider(ResourcesUsageStore, {
        isLoading$: of(false),
        nics$: of([{ type: NetworkInterfaceType.Physical } as DashboardNetworkInterface]),
      }),
      mockProvider(DashboardStorageStore, {
        isLoading$: of(false),
        pools$: of([
          {
            name: 'pool2',
          } as Pool,
        ]),
        volumesData$: of(mockDatasets),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  it('emits the correct state', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.state$).toBe('a', {
        a: {
          availableWidgets: [
            {
              id: '0',
              name: 'System Information',
              rendered: true,
            },
            {
              name: 'Help',
              rendered: true,
            },
            {
              id: '2',
              name: 'CPU',
              rendered: true,
            },
            {
              id: '3',
              name: 'Memory',
              rendered: true,
            },
            {
              id: '4',
              name: 'Storage',
              rendered: true,
            },
            {
              id: '5',
              name: 'Network',
              rendered: true,
            },
            {
              id: '6',
              identifier: 'name,Pool:pool2',
              name: 'Pool',
              rendered: false,
            },
            {
              id: '7',
              identifier: 'name,undefined',
              name: 'Interface',
              rendered: false,
            },
          ],
          dashboardState: [
            {
              id: '0',
              name: 'System Information',
              rendered: false,
            },
            {
              name: 'Help',
              rendered: false,
            },
            {
              id: '2',
              name: 'CPU',
              rendered: false,
            },
            {
              id: '3',
              name: 'Memory',
              rendered: false,
            },
            {
              id: '4',
              name: 'Storage',
              rendered: false,
            },
            {
              id: '5',
              name: 'Network',
              rendered: false,
            },
            {
              id: '6',
              identifier: 'name,Pool:pool2',
              name: 'Pool',
              rendered: false,
            },
          ],
          isHaLicensed: false,
          isLoading: false,
          nics: [
            {
              type: 'PHYSICAL',
            },
          ],
          pools: [
            {
              name: 'pool2',
            },
          ],
          sysInfoWithFeatures: {
            cores: 6,
            features: {
              enclosure: true,
            },
          },
          volumesData: [
            {
              available: {
                parsed: 1024,
              },
              id: 'dataset_id1',
              name: 'APPS',
              used: {
                parsed: 1024,
              },
            },
            {
              available: {
                parsed: 1024,
              },
              id: 'dataset_id2',
              name: 'POOL',
              used: {
                parsed: 512,
              },
            },
          ],
        },
      });
    });
  });
});
