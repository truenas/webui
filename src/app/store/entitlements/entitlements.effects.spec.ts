import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { CallResponse } from '@truenas/api-client';
import {
  firstValueFrom, Observable, of, ReplaySubject, Subject, throwError,
} from 'rxjs';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { entitlementsLoaded, entitlementsLoadFailed } from 'app/store/entitlements/entitlements.actions';
import { EntitlementsEffects } from 'app/store/entitlements/entitlements.effects';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';

type EntitlementsInfo = CallResponse<WebUiApiDirectory, 'truenas.entitlements.info'>;

const info = {
  features: {
    [EntitlementFeature.Kmip]: {
      entitled: false,
      reason: EntitlementReason.NoLicense,
      message: 'This system is not licensed to use the KMIP key management feature.',
    },
  },
} as EntitlementsInfo;

describe('EntitlementsEffects', () => {
  let spectator: SpectatorService<EntitlementsEffects>;
  let actions$: ReplaySubject<unknown>;

  const createService = createServiceFactory({
    service: EntitlementsEffects,
    providers: [
      mockTypedApi([mockTypedCall('truenas.entitlements.info', info)]),
      provideMockActions(() => actions$),
    ],
  });

  beforeEach(() => {
    actions$ = new ReplaySubject(1);
    spectator = createService();
  });

  it('loads entitlements when the admin UI initializes', async () => {
    actions$.next(adminUiInitialized());

    expect(await firstValueFrom(spectator.service.loadEntitlements))
      .toEqual(entitlementsLoaded({ entitlements: info.features }));
  });

  it('reloads when system info is updated, so a decision never outlives its license', async () => {
    actions$.next(systemInfoUpdated());

    expect(await firstValueFrom(spectator.service.loadEntitlements))
      .toEqual(entitlementsLoaded({ entitlements: info.features }));
  });

  it('supersedes an in-flight load rather than racing it', () => {
    const slow$ = new Subject<EntitlementsInfo>();
    const fast = { features: {} } as EntitlementsInfo;
    jest.spyOn(spectator.inject(TypedApiService), 'call')
      .mockReturnValueOnce(slow$ as unknown as Observable<never>)
      .mockReturnValueOnce(of(fast) as unknown as Observable<never>);

    const emitted: unknown[] = [];
    spectator.service.loadEntitlements.subscribe((action) => emitted.push(action));

    actions$.next(adminUiInitialized());
    actions$.next(systemInfoUpdated());
    slow$.next(info);
    slow$.complete();

    expect(emitted).toEqual([entitlementsLoaded({ entitlements: fast.features })]);
  });

  it('reports failure instead of erroring, leaving the reducer to fall back permissively', async () => {
    jest.spyOn(spectator.inject(TypedApiService), 'call')
      .mockReturnValue(throwError(() => new Error('websocket down')));
    jest.spyOn(console, 'error').mockImplementation();
    actions$.next(adminUiInitialized());

    expect(await firstValueFrom(spectator.service.loadEntitlements)).toEqual(entitlementsLoadFailed());
  });
});
