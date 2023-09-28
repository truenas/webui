import { Router } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, ReplaySubject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import network_interfaces_helptext from 'app/helptext/network/interfaces/interfaces-list';
import { DialogService } from 'app/services/dialog.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  checkinIndicatorPressed,
  networkInterfacesCheckinLoaded,
} from 'app/store/network-interfaces/network-interfaces.actions';
import { NetworkInterfacesEffects } from 'app/store/network-interfaces/network-interfaces.effects';

describe('NetworkInterfacesEffects', () => {
  let spectator: SpectatorService<NetworkInterfacesEffects>;
  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: NetworkInterfacesEffects,
    providers: [
      provideMockActions(() => actions$),
      mockWebsocket([
        mockCall('interface.has_pending_changes', true),
        mockCall('interface.checkin_waiting', 60),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(Router, {
        url: '/storage',
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('loadCheckinStatus$', () => {
    it('loads NIC checkin status and dispatches networkInterfacesCheckinLoaded()', async () => {
      actions$.next(adminUiInitialized());
      const dispatchedAction = await firstValueFrom(spectator.service.loadCheckinStatus$);
      expect(dispatchedAction).toEqual(networkInterfacesCheckinLoaded({
        hasPendingChanges: true,
        checkinWaiting: 60,
      }));
    });
  });

  describe('showCheckinPrompt$', () => {
    it('shows confirmation dialog and redirects to /network when checkinIndicatorPressed is dispatched', () => {
      actions$.next(checkinIndicatorPressed());
      spectator.service.showCheckinPrompt$.subscribe();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: network_interfaces_helptext.pending_checkin_dialog_text,
      }));
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/network']);
    });

    it('shows confirmation dialog when networkInterfacesCheckinLoaded is dispatched with true values', () => {
      actions$.next(networkInterfacesCheckinLoaded({
        hasPendingChanges: true,
        checkinWaiting: 60,
      }));
      spectator.service.showCheckinPrompt$.subscribe();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: network_interfaces_helptext.pending_checkin_dialog_text,
      }));
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/network']);
    });
  });
});
