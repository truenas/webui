import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { NetworkService } from 'app/services/network.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('NetworkService', () => {
  let spectator: SpectatorService<NetworkService>;
  let store$: MockStore;

  const createService = createServiceFactory({
    service: NetworkService,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: false },
        ],
      }),
      mockProvider(ApiService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store$ = spectator.inject(MockStore);
  });

  function setupMocks(licensed: boolean, status: FailoverStatus, config: FailoverConfig): void {
    store$.overrideSelector(selectIsHaLicensed, licensed);
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method: string) => {
      if (method === 'failover.status') {
        return of(status);
      }
      if (method === 'failover.config') {
        return of(config);
      }
      return of();
    });
  }

  describe('getIsHaEnabled', () => {
    it('returns false when not licensed', async () => {
      setupMocks(false, FailoverStatus.Master, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(false);
    });

    it('returns false when status is Single', async () => {
      setupMocks(true, FailoverStatus.Single, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(false);
    });

    it('returns false when config is disabled', async () => {
      setupMocks(true, FailoverStatus.Master, { disabled: true } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(false);
    });

    it('returns false when not licensed and status is Single', async () => {
      setupMocks(false, FailoverStatus.Single, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(false);
    });

    it('returns false when not licensed and config is disabled', async () => {
      setupMocks(false, FailoverStatus.Master, { disabled: true } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(false);
    });

    it('returns false when status is Single and config is disabled', async () => {
      setupMocks(true, FailoverStatus.Single, { disabled: true } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(false);
    });

    it('returns false when all conditions fail', async () => {
      setupMocks(false, FailoverStatus.Single, { disabled: true } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(false);
    });

    it('returns true when licensed with Master status and config enabled', async () => {
      setupMocks(true, FailoverStatus.Master, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(true);
    });

    it('returns true when licensed with Backup status and config enabled', async () => {
      setupMocks(true, FailoverStatus.Backup, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(true);
    });

    it('returns true when licensed with Electing status and config enabled', async () => {
      setupMocks(true, FailoverStatus.Electing, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(true);
    });

    it('returns true when licensed with Importing status and config enabled', async () => {
      setupMocks(true, FailoverStatus.Importing, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(true);
    });

    it('returns true when licensed with Error status and config enabled', async () => {
      setupMocks(true, FailoverStatus.Error, { disabled: false } as FailoverConfig);

      const result = await firstValueFrom(spectator.service.getIsHaEnabled());
      expect(result).toBe(true);
    });
  });
});
