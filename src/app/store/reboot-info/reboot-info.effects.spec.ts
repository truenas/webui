import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, ReplaySubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { FailoverRebootInfo, SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { failoverLicensedStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { rebootInfoLoaded } from 'app/store/reboot-info/reboot-info.actions';
import { RebootInfoEffects } from 'app/store/reboot-info/reboot-info.effects';

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
      mockApi([
        mockCall('system.reboot.info', fakeThisNodeRebootInfo),
        mockCall('failover.reboot.info', {
          this_node: fakeThisNodeRebootInfo,
          other_node: fakeOtherNodeRebootInfo,
        }),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    jest.spyOn(spectator.inject(ApiService), 'subscribe').mockImplementation((method) => {
      if (method === 'system.reboot.info') {
        return of({ fields: fakeThisNodeRebootInfo } as ApiEvent<SystemRebootInfo>);
      }
      if (method === 'failover.reboot.info') {
        return of({
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
  });
});
