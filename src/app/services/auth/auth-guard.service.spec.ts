import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { AuthGuardService } from 'app/services/auth/auth-guard.service';
import { AuthService } from 'app/services/auth/auth.service';

describe('AuthGuardService', () => {
  const redirectUrl = 'storage/disks';
  const isAuthenticated$ = new BehaviorSubject(false);
  const arSnapshot = { queryParams: {} } as ActivatedRouteSnapshot;
  const state = { url: redirectUrl } as RouterStateSnapshot;

  let spectator: SpectatorService<AuthGuardService>;
  const createService = createServiceFactory({
    service: AuthGuardService,
    providers: [mockProvider(AuthService, { isAuthenticated$ })],
  });

  beforeEach(() => {
    spectator = createService();
    isAuthenticated$.next(false);
  });

  describe('canActivate', () => {
    it('allows activation if the user is logged in', () => {
      expect(spectator.service.canActivate(arSnapshot, state)).toBe(false);
      isAuthenticated$.next(true);
      expect(spectator.service.canActivate(arSnapshot, state)).toBe(true);
    });

    it('if the user is not logged in, the redirect URL is saved to sessionStorage', () => {
      spectator.service.canActivate(arSnapshot, state);
      expect(sessionStorage.getItem('redirectUrl')).toEqual(redirectUrl);
    });

    it('if the user is not logged in, the user is redirected to signin', () => {
      const router = spectator.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigate');
      spectator.service.canActivate(arSnapshot, state);
      expect(navigateSpy).toHaveBeenCalledWith(['/signin'], { queryParams: {} });
    });
  });
});
