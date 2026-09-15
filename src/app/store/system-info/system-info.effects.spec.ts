import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, ReplaySubject, of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { HardwareType } from 'app/enums/hardware-type.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { LicenseType } from 'app/enums/license-type.enum';
import { ContractType, License, SystemInfo } from 'app/interfaces/system-info.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { entitlementFactsLoaded, systemInfoLoaded } from 'app/store/system-info/system-info.actions';
import { SystemInfoEffects } from 'app/store/system-info/system-info.effects';

describe('SystemInfoEffects', () => {
  let spectator: SpectatorService<SystemInfoEffects>;
  let api: ApiService;
  let actions$: ReplaySubject<unknown>;

  const baseSystemInfo = { hostname: 'test-host', license: null } as unknown as SystemInfo;

  const baseLicense: License = {
    id: 'test-id',
    type: LicenseType.EnterpriseSingle,
    contract_type: ContractType.Gold,
    model: 'M40',
    expires_at: null,
    features: [{
      name: LicenseFeature.Apps, start_date: null, expires_at: null, source: 'enterprise', type: null,
    }],
    serials: ['CI-1'],
    enclosures: {},
  };

  const createService = createServiceFactory({
    service: SystemInfoEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore(),
      mockApi([
        mockCall('system.info', baseSystemInfo),
        mockCall('truenas.license.info', baseLicense),
        mockCall('truenas.is_ix_hardware', true),
        mockCall('truenas.entitlements.facts', {
          hardware_type: HardwareType.Truenas,
          license_type: LicenseType.EnterpriseSingle,
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(ApiService);
    actions$ = new ReplaySubject(1);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * The effect's forkJoin issues two API calls per dispatch — stub both with
   * one switch so each test can pin precise responses without touching the
   * default mockApi setup.
   */
  function stubLoadCalls(license: License | null, licenseError?: Error): void {
    jest.spyOn(api, 'call').mockImplementation((method: string) => {
      if (method === 'system.info') {
        return of(baseSystemInfo) as never;
      }
      if (method === 'truenas.license.info') {
        return licenseError ? throwError(() => licenseError) : of(license) as never;
      }
      return of(null) as never;
    });
  }

  describe('loadSystemInfo', () => {
    it('merges truenas.license.info into systemInfo before dispatching', async () => {
      actions$.next(adminUiInitialized());

      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(api.call).toHaveBeenCalledWith('system.info');
      expect(api.call).toHaveBeenCalledWith('truenas.license.info');
      expect(action).toEqual(systemInfoLoaded({
        systemInfo: { ...baseSystemInfo, license: baseLicense },
      }));
    });

    it('emits systemInfoLoaded with license: null when truenas.license.info errors', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      stubLoadCalls(null, new Error('license fetch failed'));

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(action).toEqual(systemInfoLoaded({
        systemInfo: { ...baseSystemInfo, license: null },
      }));
    });

    it('uppercases lower-cased contract_type', async () => {
      stubLoadCalls({ ...baseLicense, contract_type: 'gold' as ContractType });

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(action.systemInfo.license?.contract_type).toBe(ContractType.Gold);
    });

    it('preserves unknown contract_type values and warns', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      stubLoadCalls({ ...baseLicense, contract_type: 'platinum' as unknown as ContractType });

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(action.systemInfo.license?.contract_type).toBe('PLATINUM');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('platinum'));
    });
  });

  describe('loadEntitlementFacts', () => {
    it('loads truenas.entitlements.facts', async () => {
      actions$.next(adminUiInitialized());

      const action = await firstValueFrom(spectator.service.loadEntitlementFacts);

      expect(api.call).toHaveBeenCalledWith('truenas.entitlements.facts');
      expect(action).toEqual(entitlementFactsLoaded({
        entitlementFacts: { hardware_type: HardwareType.Truenas, license_type: LicenseType.EnterpriseSingle },
      }));
    });

    it('falls back to community hardware without a license when the call fails', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('facts failed')));

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadEntitlementFacts);

      expect(action).toEqual(entitlementFactsLoaded({
        entitlementFacts: { hardware_type: HardwareType.Community, license_type: null },
      }));
    });
  });
});
