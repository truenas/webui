import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, ReplaySubject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { EulaEffects } from 'app/store/eula/eula.effects';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

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
      provideMockStore({
        selectors: [{
          selector: selectProductType,
          value: ProductType.Enterprise,
        }],
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

    it('should show EULA dialog on enterprise systems', () => {
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please do not sue us.',
      }));
    });

    it('should call truenas.accept_eula when EULA dialog is accepted', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('truenas.accept_eula');
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
