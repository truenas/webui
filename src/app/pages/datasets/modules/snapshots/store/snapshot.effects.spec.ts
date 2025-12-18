import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  snapshotPageEntered,
  snapshotsLoaded,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { SnapshotEffects } from 'app/pages/datasets/modules/snapshots/store/snapshot.effects';
import { snapshotsInitialState } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';
import { AppState } from 'app/store';
import { snapshotExtraColumnsToggled } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const fakeSnapshots = [
  { name: 'test@snapshot1', dataset: 'test', snapshot_name: 'snapshot1' },
] as ZfsSnapshot[];

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
        mockCall('pool.snapshot.query', fakeSnapshots),
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
    it('loads snapshots when snapshotPageEntered is dispatched', async () => {
      actions$.next(snapshotPageEntered());

      const dispatchedAction = await firstValueFrom(spectator.service.loadSnapshots$);
      expect(dispatchedAction).toEqual(snapshotsLoaded({ snapshots: fakeSnapshots }));
      expect(api.call).toHaveBeenCalledTimes(1);
    });

    it('should not make duplicate API calls when preferences change', async () => {
      actions$.next(snapshotPageEntered());

      await firstValueFrom(spectator.service.loadSnapshots$);
      expect(api.call).toHaveBeenCalledTimes(1);

      store$.overrideSelector(selectPreferences, { showSnapshotExtraColumns: true } as Preferences);
      store$.refreshState();

      // snapshotExtraColumnsToggled doesn't trigger the effect, so no new call
      actions$.next(snapshotExtraColumnsToggled());

      // Verify no additional calls were made (still 1)
      expect(api.call).toHaveBeenCalledTimes(1);
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
});
