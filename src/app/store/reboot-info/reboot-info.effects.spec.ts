import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom, of, ReplaySubject, Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { failoverLicensedStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { rebootInfoLoaded, refreshRebootInfo } from 'app/store/reboot-info/reboot-info.actions';
import { RebootInfoEffects } from 'app/store/reboot-info/reboot-info.effects';

type FailoverRebootInfo = CallResponse<WebUiApiDirectory, 'failover.reboot.info'>;

const fakeThisNodeRebootInfo: SystemRebootInfo = {
  boot_id: 'this-boot-id',
  reboot_required_reasons: [
    { code: 'FIPS', reason: 'Test Reason 1' },
    { code: 'FIPS', reason: 'Test Reason 2' },
  ],
};

const fakeOtherNodeRebootInfo: SystemRebootInfo = {
  boot_id: 'other-boot-id',
  reboot_required_reasons: [
    { code: 'FIPS', reason: 'Test Reason 3' },
    { code: 'FIPS', reason: 'Test Reason 4' },
  ],
};

describe('RebootInfoEffects', () => {
  let spectator: SpectatorService<RebootInfoEffects>;
  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: RebootInfoEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: false },
        ],
      }),
      mockTypedApi([
        mockTypedCall('system.reboot.info', fakeThisNodeRebootInfo),
        mockTypedCall('failover.reboot.info', {
          this_node: fakeThisNodeRebootInfo,
          other_node: fakeOtherNodeRebootInfo,
        }),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    jest.spyOn(spectator.inject(TypedApiService), 'subscribe').mockImplementation((method) => {
      if (method === 'system.reboot.info') {
        return of({ msg: CollectionChangeType.Changed, fields: fakeThisNodeRebootInfo } as ApiEvent<SystemRebootInfo>);
      }
      if (method === 'failover.reboot.info') {
        return of({
          msg: CollectionChangeType.Changed,
          fields: {
            this_node: fakeThisNodeRebootInfo,
            other_node: fakeOtherNodeRebootInfo,
          },
        } as ApiEvent<FailoverRebootInfo>);
      }
      return of();
    });
  });

  describe('loadRebootInfo', () => {
    it('loads reboot info and dispatches rebootInfoLoaded() for HA', async () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));
      const dispatchedAction = await firstValueFrom(spectator.service.loadRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: fakeOtherNodeRebootInfo,
      }));
    });

    it('loads reboot info and dispatches rebootInfoLoaded() for non-HA', async () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));
      const dispatchedAction = await firstValueFrom(spectator.service.loadRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: null,
      }));
    });

    it('drops a fetch started on a stale licensed status once it is corrected', () => {
      // The HA fetch is still in flight when the entitlement corrects the status to non-HA; its
      // late answer must not overwrite the corrected one.
      const haInfo$ = new Subject<FailoverRebootInfo>();
      jest.spyOn(spectator.inject(TypedApiService), 'call').mockImplementation((method) => (
        method === 'failover.reboot.info' ? haInfo$ : of(fakeThisNodeRebootInfo)
      ));
      const dispatched: unknown[] = [];
      spectator.service.loadRebootInfo.subscribe((action) => dispatched.push(action));
      dispatched.length = 0;

      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));
      haInfo$.next({ this_node: fakeThisNodeRebootInfo, other_node: fakeOtherNodeRebootInfo });

      expect(dispatched).toEqual([rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: null,
      })]);
    });
  });

  describe('subscribeToRebootInfo', () => {
    it('subscribes to reboot info and dispatches rebootInfoLoaded() for HA', async () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));
      const dispatchedAction = await firstValueFrom(spectator.service.subscribeToRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: fakeOtherNodeRebootInfo,
      }));
    });

    it('subscribes to reboot info and dispatches rebootInfoLoaded() for non-HA', async () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));
      const dispatchedAction = await firstValueFrom(spectator.service.subscribeToRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: null,
      }));
    });

    it('replaces the subscription when the licensed status is corrected later', () => {
      // Sign-in seeds HA as licensed, then the HA entitlement says otherwise: the first source
      // must be torn down, or both keep pushing reboot info and race each other.
      const haEvents$ = new Subject<ApiEvent<FailoverRebootInfo>>();
      jest.spyOn(spectator.inject(TypedApiService), 'subscribe').mockImplementation((method) => (
        method === 'failover.reboot.info'
          ? haEvents$
          : of({ msg: CollectionChangeType.Changed, fields: fakeThisNodeRebootInfo } as ApiEvent<SystemRebootInfo>)
      ));
      const dispatched: unknown[] = [];
      spectator.service.subscribeToRebootInfo.subscribe((action) => dispatched.push(action));
      // `actions$` replays the previous test's action to a new subscriber; start counting here.
      dispatched.length = 0;

      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));
      haEvents$.next({
        msg: CollectionChangeType.Changed,
        fields: { this_node: fakeThisNodeRebootInfo, other_node: fakeOtherNodeRebootInfo },
      } as ApiEvent<FailoverRebootInfo>);

      expect(dispatched).toEqual([rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: null,
      })]);
    });
  });

  describe('refreshRebootInfo', () => {
    it('refreshes reboot info and dispatches rebootInfoLoaded() for non-HA', async () => {
      actions$.next(refreshRebootInfo());
      const dispatchedAction = await firstValueFrom(spectator.service.refreshRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: null,
      }));
    });

    it('refreshes reboot info and dispatches rebootInfoLoaded() for HA', async () => {
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectIsHaLicensed, true);

      actions$.next(refreshRebootInfo());
      const dispatchedAction = await firstValueFrom(spectator.service.refreshRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeRebootInfo: fakeThisNodeRebootInfo,
        otherNodeRebootInfo: fakeOtherNodeRebootInfo,
      }));
    });
  });
});
