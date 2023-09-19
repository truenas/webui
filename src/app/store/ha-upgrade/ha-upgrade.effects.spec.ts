import { MatDialog } from '@angular/material/dialog';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of, ReplaySubject } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { haStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  failoverUpgradeFinished,
  updatePendingIndicatorPressed,
  upgradePendingStateLoaded,
} from 'app/store/ha-upgrade/ha-upgrade.actions';
import { HaUpgradeEffects } from 'app/store/ha-upgrade/ha-upgrade.effects';

describe('HaUpgradeEffects', () => {
  let spectator: SpectatorService<HaUpgradeEffects>;
  const actions$ = new ReplaySubject<unknown>(1);
  const createComponent = createServiceFactory({
    service: HaUpgradeEffects,
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebsocket([
        mockCall('failover.upgrade_pending', true),
        mockJob('failover.upgrade_finish', fakeSuccessfulJob()),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
        ],
      }),
      provideMockActions(() => actions$),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('loadUpgradePendingState$', () => {
    it('checks whether upgrade is pending when HA is enabled', async () => {
      actions$.next(haStatusLoaded({
        haStatus: {
          hasHa: true,
          reasons: [],
        },
      }));

      expect(await firstValueFrom(spectator.service.loadUpgradePendingState$))
        .toEqual(upgradePendingStateLoaded({ isUpgradePending: true }));

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('failover.upgrade_pending');
    });

    it('does not check whether upgrade is pending when HA is disabled',  () => {
      actions$.next(haStatusLoaded({
        haStatus: {
          hasHa: false,
          reasons: [FailoverDisabledReason.MismatchDisks, FailoverDisabledReason.NoPong],
        },
      }));

      spectator.service.loadUpgradePendingState$.subscribe();

      expect(spectator.inject(WebSocketService).call).not.toHaveBeenCalledWith('failover.upgrade_pending');
    });

    it('checks whether upgrade is pending when HA is disabled due to version mismatch', async () => {
      actions$.next(haStatusLoaded({
        haStatus: {
          hasHa: false,
          reasons: [FailoverDisabledReason.MismatchVersions],
        },
      }));

      expect(await firstValueFrom(spectator.service.loadUpgradePendingState$))
        .toEqual(upgradePendingStateLoaded({ isUpgradePending: true }));

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('failover.upgrade_pending');
    });
  });

  describe('showUpgradePendingDialog$', () => {
    it('shows warning about pending upgrade when upgradePendingStateLoaded is dispatched with true', async () => {
      actions$.next(upgradePendingStateLoaded({ isUpgradePending: true }));

      await firstValueFrom(spectator.service.showUpgradePendingDialog$);

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Pending Upgrade',
      }));
    });

    it('shows warning about pending upgrade when updatePendingIndicatorPressed is dispatched', async () => {
      actions$.next(updatePendingIndicatorPressed());

      await firstValueFrom(spectator.service.showUpgradePendingDialog$);

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Pending Upgrade',
      }));
    });

    it('finishes upgrade and dispatches `failoverUpgradeFinished` when dialog is confirmed', async () => {
      actions$.next(updatePendingIndicatorPressed());
      await firstValueFrom(spectator.service.showUpgradePendingDialog$);

      expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith('failover.upgrade_finish');

      expect(await firstValueFrom(spectator.service.showUpgradePendingDialog$))
        .toEqual(failoverUpgradeFinished());
    });
  });
});
