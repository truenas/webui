import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, ReplaySubject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { FailoverRebootInfo, SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { WebSocketService } from 'app/services/ws.service';
import { failoverLicensedStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { rebootInfoLoaded } from 'app/store/reboot-info/reboot-info.actions';
import { RebootInfoEffects } from 'app/store/reboot-info/reboot-info.effects';

const fakeThisNodeInfo: SystemRebootInfo = {
  boot_id: 'this-boot-id',
  reboot_required_reasons: [
    { code: 'FIPS', reason: 'Test Reason 1' },
    { code: 'FIPS', reason: 'Test Reason 2' },
  ],
};

const fakeOtherNodeInfo: SystemRebootInfo = {
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
      mockWebSocket([
        mockCall('system.reboot.info', fakeThisNodeInfo),
        mockCall('failover.reboot.info', {
          this_node: fakeThisNodeInfo,
          other_node: fakeOtherNodeInfo,
        }),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    jest.spyOn(spectator.inject(WebSocketService), 'subscribe').mockImplementation((method) => {
      if (method === 'system.reboot.info') {
        return of({ fields: fakeThisNodeInfo } as ApiEvent<SystemRebootInfo>);
      }
      if (method === 'failover.reboot.info') {
        return of({
          fields: {
            this_node: fakeThisNodeInfo,
            other_node: fakeOtherNodeInfo,
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
        thisNodeInfo: fakeThisNodeInfo,
        otherNodeInfo: fakeOtherNodeInfo,
      }));
    });

    it('loads reboot info and dispatches rebootInfoLoaded() for non-HA', async () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));
      const dispatchedAction = await firstValueFrom(spectator.service.loadRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeInfo: fakeThisNodeInfo,
        otherNodeInfo: null,
      }));
    });
  });

  describe('subscribeToRebootInfo', () => {
    it('subscribes to reboot info and dispatches rebootInfoLoaded() for HA', async () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));
      const dispatchedAction = await firstValueFrom(spectator.service.subscribeToRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeInfo: fakeThisNodeInfo,
        otherNodeInfo: fakeOtherNodeInfo,
      }));
    });

    it('subscribes to reboot info and dispatches rebootInfoLoaded() for non-HA', async () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));
      const dispatchedAction = await firstValueFrom(spectator.service.subscribeToRebootInfo);
      expect(dispatchedAction).toEqual(rebootInfoLoaded({
        thisNodeInfo: fakeThisNodeInfo,
        otherNodeInfo: null,
      }));
    });
  });
});
