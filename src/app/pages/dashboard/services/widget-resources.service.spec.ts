import { fakeAsync, tick } from '@angular/core/testing';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { finalize, firstValueFrom, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App } from 'app/interfaces/app.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { UpdateStatus } from 'app/interfaces/system-update.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const pools = [
  { id: 1, name: 'pool_1' },
  { id: 2, name: 'pool_2' },
] as Pool[];

const apps = [
  { id: '1', name: 'app_1' },
  { id: '2', name: 'app_2' },
] as App[];

const interfaceEth0 = {
  name: 'interface',
  identifier: 'eth0',
  legend: ['time', 'received', 'sent'],
  start: 1735281261,
  end: 1735281265,
  data: [
    [1740117920, 2.2, 0.5],
    [1740117921, 2.3, 1.2],
    [1740117922, 2.4, 1.1],
  ],
  aggregations: { min: [0], mean: [5], max: [10] },
};

describe('WidgetResourcesService', () => {
  let spectator: SpectatorService<WidgetResourcesService>;
  const createService = createServiceFactory({
    service: WidgetResourcesService,
    providers: [
      mockApi([
        mockCall('app.query', apps),
        mockCall('pool.query', pools),
        mockCall('replication.query'),
        mockCall('rsynctask.query'),
        mockCall('cloudsync.query'),
        mockCall('webui.main.dashboard.sys_info'),
        mockCall('interface.query'),
        mockCall('update.status', {
          status: {
            new_version: {},
          },
        } as UpdateStatus),
        mockCall('reporting.netdata_get_data', [interfaceEth0]),
      ]),
      mockProvider(Store, {
        dispatch: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              datetime: { $date: 1740117922320 },
            } as SystemInfo,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('returns pools', async () => {
    expect(await firstValueFrom(spectator.service.pools$)).toEqual(pools);
  });

  it('returns apps', async () => {
    expect(await firstValueFrom(spectator.service.installedApps$)).toEqual(apps);
  });

  describe('updateAvailable$', () => {
    it('returns true when api knows about available updates', async () => {
      expect(await firstValueFrom(spectator.service.updateAvailable$)).toBe(true);
    });
  });

  describe('networkInterfaceLastHourStats', () => {
    it('returns network interface stats for the last hour', async () => {
      expect(
        await firstValueFrom(spectator.service.networkInterfaceLastHourStats('eth0')),
      ).toEqual([interfaceEth0]);
    });
  });
});

describe('WidgetResourcesService - realtimeUpdates$ subscription behavior', () => {
  let teardownCount: number;
  let realtimeSubject$: Subject<ApiEvent<ReportingRealtimeUpdate>>;

  const createService = createServiceFactory({
    service: WidgetResourcesService,
    providers: [
      {
        provide: ApiService,
        useFactory: () => ({
          subscribe: jest.fn(() => realtimeSubject$.pipe(
            finalize(() => { teardownCount++; }),
          )),
          call: jest.fn(() => new Subject()),
          callAndSubscribe: jest.fn(() => new Subject()),
        }),
      },
      mockProvider(Store, { dispatch: jest.fn() }),
      provideMockStore({
        selectors: [{ selector: selectSystemInfo, value: {} as SystemInfo }],
      }),
    ],
  });

  beforeEach(() => {
    teardownCount = 0;
    realtimeSubject$ = new Subject();
  });

  it('should not unsubscribe during brief zero-refcount periods', fakeAsync(() => {
    const spectator = createService();

    // First subscriber
    const sub1 = spectator.service.realtimeUpdates$.subscribe();
    tick(100);

    // Unsubscribe (refcount = 0)
    sub1.unsubscribe();
    tick(1000); // Within the 2-second window

    // New subscriber before timer expires - should reuse existing subscription
    const sub2 = spectator.service.realtimeUpdates$.subscribe();
    tick(100);

    // Teardown should NOT have been called because we resubscribed within 2 seconds
    expect(teardownCount).toBe(0);

    sub2.unsubscribe();
    tick(2100); // Past the 2-second window, cleanup happens
  }));

  it('should unsubscribe after the resetOnRefCountZero delay expires', fakeAsync(() => {
    const spectator = createService();

    // First subscriber
    const sub1 = spectator.service.realtimeUpdates$.subscribe();
    tick(100);

    // Unsubscribe and wait past the 2-second window
    sub1.unsubscribe();
    tick(2100);

    // Teardown SHOULD have been called after waiting past 2 seconds
    expect(teardownCount).toBe(1);
  }));

  it('should handle rapid subscribe/unsubscribe cycles during widget initialization', fakeAsync(() => {
    const spectator = createService();

    // Simulate the race condition: widgets subscribe, then briefly unsubscribe
    // during Angular change detection, then resubscribe
    const sub1 = spectator.service.realtimeUpdates$.subscribe();
    tick(50);

    // Widget temporarily destroyed during @if evaluation or async pipe setup
    sub1.unsubscribe();
    tick(100); // Brief gap with zero subscribers

    // Widget re-renders and subscribes again
    const sub2 = spectator.service.realtimeUpdates$.subscribe();
    tick(50);

    // Another widget joins
    const sub3 = spectator.service.realtimeUpdates$.subscribe();
    tick(100);

    // All these rapid changes should NOT have caused teardown
    expect(teardownCount).toBe(0);

    // Now simulate leaving the dashboard
    sub2.unsubscribe();
    sub3.unsubscribe();
    tick(2100);

    // After grace period, teardown should happen
    expect(teardownCount).toBe(1);
  }));
});
