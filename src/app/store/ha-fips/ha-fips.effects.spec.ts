import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { FipsService } from 'app/services/fips.service';
import { HaFipsEffects } from 'app/store/ha-fips/ha-fips.effects';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { rebootInfoLoaded } from 'app/store/reboot-info/reboot-info.actions';

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

describe('HaFipsEffects', () => {
  let spectator: SpectatorService<HaFipsEffects>;
  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: HaFipsEffects,
    providers: [
      provideMockActions(() => actions$),
      mockWebSocket([]),
      mockProvider(FipsService),
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectHaStatus,
            value: {
              hasHa: true,
              reasons: [
                FailoverDisabledReason.LocalFipsRebootRequired,
                FailoverDisabledReason.RemoteFipsRebootRequired,
              ],
            } as HaStatus,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('checkIfRebootRequired$', () => {
    it('calls promptForFailover when this node needs to be rebooted', () => {
      actions$.next(rebootInfoLoaded({ thisNodeRebootInfo: fakeThisNodeRebootInfo, otherNodeRebootInfo: null }));

      spectator.service.checkIfRebootRequired$.subscribe();
      expect(spectator.inject(FipsService).promptForFailover).toHaveBeenCalledWith();
    });

    it('calls promptForRemoteRestart when other node needs to be rebooted', () => {
      actions$.next(rebootInfoLoaded({ thisNodeRebootInfo: null, otherNodeRebootInfo: fakeOtherNodeRebootInfo }));

      spectator.service.checkIfRebootRequired$.subscribe();
      expect(spectator.inject(FipsService).promptForRemoteRestart).toHaveBeenCalledWith();
    });

    it('nothing is called when there is no reason', () => {
      actions$.next(rebootInfoLoaded({ thisNodeRebootInfo: null, otherNodeRebootInfo: null }));

      spectator.service.checkIfRebootRequired$.subscribe();
      expect(spectator.inject(FipsService).promptForFailover).not.toHaveBeenCalledWith();
      expect(spectator.inject(FipsService).promptForRemoteRestart).not.toHaveBeenCalledWith();
    });
  });
});
