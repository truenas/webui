import { getMissingInjectionErrorFactory, getMissingInjectionErrorObservable } from 'app/core/testing/utils/missing-injection-factories';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

export class EmptyAuthService {
  readonly authToken$ = getMissingInjectionErrorObservable(AuthService.name);
  readonly isAuthenticated$ = getMissingInjectionErrorObservable(WebSocketStatusService.name);
  readonly user$ = getMissingInjectionErrorObservable(AuthService.name);
  readonly isSysAdmin$ = getMissingInjectionErrorObservable(AuthService.name);
  readonly userTwoFactorConfig$ = getMissingInjectionErrorObservable(AuthService.name);
  getGlobalTwoFactorConfig = getMissingInjectionErrorFactory(AuthService.name);
  globalTwoFactorConfigUpdated = getMissingInjectionErrorFactory(AuthService.name);
  clearAuthToken = getMissingInjectionErrorFactory(AuthService.name);
  login = getMissingInjectionErrorFactory(AuthService.name);
  hasRole = getMissingInjectionErrorFactory(AuthService.name);
  logout = getMissingInjectionErrorFactory(AuthService.name);
  refreshUser = getMissingInjectionErrorFactory(AuthService.name);
  loginWithToken = getMissingInjectionErrorFactory(AuthService.name);
  setQueryToken = getMissingInjectionErrorFactory(AuthService.name);
}
