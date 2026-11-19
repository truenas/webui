import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { ApiService } from 'app/modules/websocket/api.service';
import { NetworkService } from 'app/services/network.service';
import { selectIsHaEnabled } from 'app/store/ha-info/ha-info.selectors';

describe('NetworkService', () => {
  let spectator: SpectatorService<NetworkService>;
  let store$: MockStore;

  const createService = createServiceFactory({
    service: NetworkService,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectIsHaEnabled, value: false },
        ],
      }),
      mockProvider(ApiService, {
        call: jest.fn(() => of(['LACP', 'FAILOVER'])),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store$ = spectator.inject(MockStore);
  });

  describe('getLaggProtocolChoices', () => {
    it('loads the supported link aggregation protocols', async () => {
      expect(await firstValueFrom(spectator.service.getLaggProtocolChoices())).toEqual(['LACP', 'FAILOVER']);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('interface.lag_supported_protocols');
    });
  });

  describe('getIsHaEnabled', () => {
    it('reflects the live HA-enabled state from the ha-info store', async () => {
      store$.overrideSelector(selectIsHaEnabled, true);
      store$.refreshState();

      expect(await firstValueFrom(spectator.service.getIsHaEnabled())).toBe(true);
    });

    it('returns false when the store reports HA is not enabled (e.g. failover disabled)', async () => {
      store$.overrideSelector(selectIsHaEnabled, false);
      store$.refreshState();

      expect(await firstValueFrom(spectator.service.getIsHaEnabled())).toBe(false);
    });

    it('emits updated values when the store changes, without a stale cache', async () => {
      store$.overrideSelector(selectIsHaEnabled, true);
      store$.refreshState();
      expect(await firstValueFrom(spectator.service.getIsHaEnabled())).toBe(true);

      store$.overrideSelector(selectIsHaEnabled, false);
      store$.refreshState();
      expect(await firstValueFrom(spectator.service.getIsHaEnabled())).toBe(false);
    });
  });
});
