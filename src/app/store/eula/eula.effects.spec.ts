import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, ReplaySubject } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { EulaEffects } from 'app/store/eula/eula.effects';

describe('EulaEffects', () => {
  let spectator: SpectatorService<EulaEffects>;
  let actions$: ReplaySubject<unknown>;

  const createService = createServiceFactory({
    service: EulaEffects,
    providers: [
      mockApi([
        mockCall('truenas.get_eula', 'Please do not sue us.'),
        mockCall('truenas.accept_eula'),
        mockCall('truenas.is_eula_accepted', false),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(TranslateService, {
        get: jest.fn((key: string) => of(key)),
      }),
      mockAuth(),
    ],
  });

  describe('with FullAdmin role', () => {
    beforeEach(() => {
      actions$ = new ReplaySubject<unknown>(1);
      spectator = createService({
        providers: [
          provideMockActions(() => actions$),
        ],
      });
      actions$.next(adminUiInitialized());
      spectator.service.checkEula$.subscribe();
    });

    it('shows the EULA dialog whenever middleware reports it pending, with no product-type check', () => {
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please do not sue us.',
      }));
    });

    it('should call truenas.accept_eula when EULA dialog is accepted', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('truenas.accept_eula');
    });
  });

  describe('when the EULA is already accepted', () => {
    it('does not show the dialog', () => {
      actions$ = new ReplaySubject<unknown>(1);
      spectator = createService({
        providers: [
          provideMockActions(() => actions$),
        ],
      });
      spectator.inject(MockApiService).mockCall('truenas.is_eula_accepted', true);
      actions$.next(adminUiInitialized());
      spectator.service.checkEula$.subscribe();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('truenas.is_eula_accepted');
      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
    });
  });

  describe('without FullAdmin role', () => {
    it('does not check for EULA if user does not have FullAdmin role', () => {
      // Create a fresh instance with ReadonlyAdmin role
      actions$ = new ReplaySubject<unknown>(1);

      const authServiceMock = {
        hasRole: jest.fn().mockReturnValue(of(false)),
        user$: of({ roles: [Role.ReadonlyAdmin] }),
      };

      spectator = createService({
        providers: [
          provideMockActions(() => actions$),
          { provide: AuthService, useValue: authServiceMock },
        ],
      });

      const apiService = spectator.inject(ApiService);
      jest.clearAllMocks();

      actions$.next(adminUiInitialized());
      spectator.service.checkEula$.subscribe();

      expect(apiService.call).not.toHaveBeenCalledWith('truenas.is_eula_accepted');
    });
  });
});
