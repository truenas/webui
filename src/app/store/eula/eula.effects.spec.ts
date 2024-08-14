import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { of, ReplaySubject } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { DialogService } from 'app/services/dialog.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { EulaEffects } from 'app/store/eula/eula.effects';

describe('EulaEffects', () => {
  let spectator: SpectatorService<EulaEffects>;
  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: EulaEffects,
    providers: [
      provideMockActions(() => actions$),
      mockWebsocket([
        mockCall('truenas.get_eula', 'Please do not sue us.'),
        mockCall('truenas.accept_eula'),
        mockCall('truenas.is_eula_accepted', false),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SystemGeneralService, {
        isEnterprise$: of(true),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    actions$.next(adminUiInitialized());
    spectator.service.checkEula$.subscribe();
  });

  it('should show EULA dialog on enterprise systems', () => {
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Please do not sue us.',
    }));
  });

  it('should call truenas.accept_eula when EULA dialog is accepted', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('truenas.accept_eula');
  });

  it('does not check for EULA if user does not have FullAdmin role', () => {
    jest.clearAllMocks();

    const authMock = spectator.inject(MockAuthService);
    authMock.setRoles([Role.ReadonlyAdmin]);
    actions$.next(adminUiInitialized());

    expect(spectator.inject(WebSocketService).call).not.toHaveBeenCalledWith('truenas.is_eula_accepted');
  });
});
