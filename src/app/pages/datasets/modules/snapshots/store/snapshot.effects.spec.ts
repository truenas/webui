import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CallResponse } from '@truenas/api-client';
import {
  firstValueFrom, ReplaySubject, Subject, Subscription,
} from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import {
  snapshotAdded,
  snapshotChanged,
  snapshotPageEntered,
  snapshotPageLeft,
  snapshotRemoved,
  snapshotsLoaded,
  snapshotsRefreshed,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import {
  SnapshotEffects, snapshotRefreshIntervalMs, snapshotRefreshWithPropertiesIntervalMs,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.effects';
import { snapshotsInitialState } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';
import { AppState } from 'app/store';
import { snapshotExtraColumnsToggled } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

type SnapshotRows = CallResponse<WebUiApiDirectory, 'zfs.resource.snapshot.list'>;

const wireSnapshots = [
  {
    name: 'test@snapshot1',
    pool: 'test',
    dataset: 'test',
    snapshot_name: 'snapshot1',
    holds: null,
    properties: null,
  },
] as SnapshotRows;

const expectedSnapshots = [
  {
    id: 'test@snapshot1',
    name: 'test@snapshot1',
    pool: 'test',
    dataset: 'test',
    snapshot_name: 'snapshot1',
    type: 'SNAPSHOT',
  },
];

describe('SnapshotEffects', () => {
  let spectator: SpectatorService<SnapshotEffects>;
  let api: ApiService;
  let store$: MockStore<AppState>;
  let actions$: ReplaySubject<unknown>;

  const createService = createServiceFactory({
    service: SnapshotEffects,
    providers: [
      provideMockActions(() => actions$),
      mockApi([
        mockCall('zfs.resource.snapshot.list', wireSnapshots),
      ]),
      provideMockStore({
        initialState: {
          snapshots: snapshotsInitialState,
        },
        selectors: [
          {
            selector: selectPreferences,
            value: { showSnapshotExtraColumns: false },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    actions$ = new ReplaySubject<unknown>(1);
    spectator = createService();
    api = spectator.inject(ApiService);
    store$ = spectator.inject(MockStore);
  });

  describe('loadSnapshots$', () => {
    it('loads every snapshot from zfs.resource.snapshot.list when snapshotPageEntered is dispatched', async () => {
      actions$.next(snapshotPageEntered());

      const dispatchedAction = await firstValueFrom(spectator.service.loadSnapshots$);
      expect(dispatchedAction).toEqual(snapshotsLoaded({ snapshots: expectedSnapshots }));
      expect(api.call).toHaveBeenCalledWith('zfs.resource.snapshot.list', [{ recursive: true, properties: null }]);
      expect(api.call).toHaveBeenCalledTimes(1);
    });

    it('drops a load that answers after the page was left', () => {
      const answer$ = new Subject<SnapshotRows>();
      jest.spyOn(api, 'call').mockReturnValueOnce(answer$ as never);
      const dispatched: Action[] = [];
      const subscription = spectator.service.loadSnapshots$.subscribe((action) => dispatched.push(action));

      actions$.next(snapshotPageEntered());
      actions$.next(snapshotPageLeft());
      answer$.next(wireSnapshots);

      // No `snapshotsLoaded`, so neither the re-read nor the event subscription starts for a closed page.
      expect(dispatched).toEqual([]);
      subscription.unsubscribe();
    });

    it('should not make duplicate API calls when preferences change', async () => {
      actions$.next(snapshotPageEntered());

      await firstValueFrom(spectator.service.loadSnapshots$);
      expect(api.call).toHaveBeenCalledTimes(1);

      store$.overrideSelector(selectPreferences, { showSnapshotExtraColumns: true } as Preferences);
      store$.refreshState();

      // snapshotExtraColumnsToggled doesn't trigger the effect, so no new call
      actions$.next(snapshotExtraColumnsToggled());

      expect(api.call).toHaveBeenCalledTimes(1);
    });

    it('requests creation/used/referenced properties when extra columns are enabled', async () => {
      store$.overrideSelector(selectPreferences, { showSnapshotExtraColumns: true } as Preferences);
      store$.refreshState();

      actions$.next(snapshotPageEntered());
      await firstValueFrom(spectator.service.loadSnapshots$);

      expect(api.call).toHaveBeenCalledWith('zfs.resource.snapshot.list', [{
        recursive: true,
        properties: ['creation', 'used', 'referenced'],
      }]);
    });

    it('should make a new API call when snapshotPageEntered is dispatched again', async () => {
      actions$.next(snapshotPageEntered());

      await firstValueFrom(spectator.service.loadSnapshots$);
      expect(api.call).toHaveBeenCalledTimes(1);

      actions$.next(snapshotPageEntered());

      await firstValueFrom(spectator.service.loadSnapshots$);
      expect(api.call).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscribeToUpdates$', () => {
    let dispatched: Action[];
    let subscription: Subscription;

    beforeEach(() => {
      dispatched = [];
      actions$.next(snapshotsLoaded({ snapshots: [] }));
      subscription = spectator.service.subscribeToUpdates$.subscribe((action) => dispatched.push(action));
    });

    afterEach(() => subscription.unsubscribe());

    it('applies ADDED, CHANGED and REMOVED events from zfs.resource.snapshot.list', () => {
      const mockApiService = spectator.inject(MockApiService);
      mockApiService.emitEvent('zfs.resource.snapshot.list', {
        msg: 'added',
        id: 'test@new',
        fields: wireSnapshots[0],
      } as never);
      mockApiService.emitEvent('zfs.resource.snapshot.list', {
        msg: 'changed',
        id: 'test@snapshot1',
        fields: { holds: ['truenas'] },
      } as never);
      mockApiService.emitEvent('zfs.resource.snapshot.list', {
        msg: 'removed',
        id: 'test@snapshot1',
      } as never);

      expect(dispatched).toEqual([
        snapshotAdded({ snapshot: expectedSnapshots[0] }),
        snapshotChanged({ id: 'test@snapshot1', changes: { holds: { truenas: 1 } } }),
        snapshotRemoved({ id: 'test@snapshot1' }),
      ]);
    });

    it('stops applying events once the page is left', () => {
      actions$.next(snapshotPageLeft());

      spectator.inject(MockApiService).emitEvent('zfs.resource.snapshot.list', {
        msg: 'removed',
        id: 'test@snapshot1',
      } as never);

      expect(dispatched).toEqual([]);
    });
  });

  describe('refreshSnapshots$', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('re-reads the list periodically until the page is left', async () => {
      const dispatched: Action[] = [];
      actions$.next(snapshotsLoaded({ snapshots: [] }));
      const subscription = spectator.service.refreshSnapshots$.subscribe((action) => dispatched.push(action));

      await jest.advanceTimersByTimeAsync(snapshotRefreshIntervalMs);

      expect(api.call).toHaveBeenCalledWith('zfs.resource.snapshot.list', [{ recursive: true, properties: null }]);
      expect(dispatched).toEqual([snapshotsRefreshed({ snapshots: expectedSnapshots })]);

      actions$.next(snapshotPageLeft());
      await jest.advanceTimersByTimeAsync(snapshotRefreshIntervalMs * 2);

      expect(api.call).toHaveBeenCalledTimes(1);
      subscription.unsubscribe();
    });

    it('skips the re-read while the tab is hidden', async () => {
      const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      actions$.next(snapshotsLoaded({ snapshots: [] }));
      const subscription = spectator.service.refreshSnapshots$.subscribe();

      await jest.advanceTimersByTimeAsync(snapshotRefreshIntervalMs * 2);
      expect(api.call).not.toHaveBeenCalled();

      hidden.mockReturnValue(false);
      await jest.advanceTimersByTimeAsync(snapshotRefreshIntervalMs);
      expect(api.call).toHaveBeenCalledTimes(1);

      hidden.mockRestore();
      subscription.unsubscribe();
    });

    it('re-reads less often when the extra columns are on', async () => {
      store$.overrideSelector(selectPreferences, { showSnapshotExtraColumns: true } as Preferences);
      store$.refreshState();
      actions$.next(snapshotsLoaded({ snapshots: [] }));
      const subscription = spectator.service.refreshSnapshots$.subscribe();

      await jest.advanceTimersByTimeAsync(snapshotRefreshIntervalMs);
      expect(api.call).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(snapshotRefreshWithPropertiesIntervalMs - snapshotRefreshIntervalMs);
      expect(api.call).toHaveBeenCalledWith('zfs.resource.snapshot.list', [{
        recursive: true,
        properties: ['creation', 'used', 'referenced'],
      }]);
      subscription.unsubscribe();
    });
  });
});
