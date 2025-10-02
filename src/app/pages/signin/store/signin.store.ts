import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { Actions, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, forkJoin, Observable, of, from,
} from 'rxjs';
import {
  catchError, filter, switchMap, take, tap,
} from 'rxjs/operators';
import { LoginResult } from 'app/enums/login-result.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FailoverValidationService } from 'app/services/failover-validation.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { UpdateService } from 'app/services/update.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { loginBannerUpdated } from 'app/store/system-config/system-config.actions';

interface SigninState {
  isLoading: boolean;
  wasAdminSet: boolean;
  loginBanner: string | null;
}

const initialState: SigninState = {
  isLoading: false,
  wasAdminSet: true,
  loginBanner: null,
};

const tokenParam = 'token' as const;

@UntilDestroy()
@Injectable()
export class SigninStore extends ComponentStore<SigninState> {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private tokenLastUsedService = inject(TokenLastUsedService);
  private systemGeneralService = inject(SystemGeneralService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);
  private updateService = inject(UpdateService);
  private actions$ = inject(Actions);
  private wsStatus = inject(WebSocketStatusService);
  private activatedRoute = inject(ActivatedRoute);
  private failoverValidation = inject(FailoverValidationService);
  private window = inject<Window>(WINDOW);

  loginBanner$ = this.select((state) => state.loginBanner);
  wasAdminSet$ = this.select((state) => state.wasAdminSet);
  isLoading$ = this.select((state) => state.isLoading);

  canLogin$ = this.wsStatus.isConnected$;

  private handleLoginResult = (loginResult: LoginResult): void => {
    if (loginResult !== LoginResult.Success) {
      this.authService.clearAuthToken();
    } else {
      // Don't immediately handle successful login - need to check failover first
      // This will be handled by the component that initiated the login
    }
  };

  getLoginErrorMessage(loginResult: LoginResult, isOtpError = false): string {
    if (loginResult === LoginResult.NoAccess) {
      return this.translate.instant('User is lacking permissions to access WebUI.');
    }

    return isOtpError
      ? this.translate.instant('Incorrect or expired OTP. Please try again.')
      : this.translate.instant('Wrong username or password. Please try again.');
  }

  constructor() {
    super(initialState);
  }

  setLoadingState = this.updater((state, isLoading: boolean) => ({ ...state, isLoading }));

  init = this.effect((trigger$: Observable<void>) => trigger$.pipe(
    tap(() => {
      // Set initial state with loading already true to avoid double emission
      this.setState({ ...initialState, isLoading: true });
    }),
    switchMap(() => this.updateService.hardRefreshIfNeeded()),
    switchMap(() => forkJoin([
      this.checkIfAdminPasswordSet(),
      this.checkForLoginBanner(),
    ])),
    tap(() => this.setLoadingState(false)),
    switchMap(() => {
      const queryToken = this.activatedRoute.snapshot.queryParamMap.get(tokenParam);
      if (queryToken) {
        return this.handleLoginWithQueryToken(queryToken);
      }

      return this.handleLoginWithToken();
    }),
    tap((result) => {
      if (result !== LoginResult.Success) {
        this.setLoadingState(false);
      }
    }),
    // Handle successful token login by performing the post-login tasks
    filter((result) => result === LoginResult.Success),
    switchMap(() => this.authService.user$.pipe(filter(Boolean), take(1))),
    switchMap(() => from(this.router.navigateByUrl(this.getRedirectUrl()))),
    catchError((error: unknown) => {
      this.setLoadingState(false);
      this.errorHandler.showErrorModal(error);
      return EMPTY;
    }),
  ));

  private withFailoverValidation = () => (source$: Observable<LoginResult>) => {
    return source$.pipe(
      switchMap((loginResult) => {
        if (loginResult === LoginResult.Success) {
          return this.performFailoverChecksAndCompleteLogin();
        }
        this.handleLoginResult(loginResult);
        return of(loginResult);
      }),
    );
  };

  handleSuccessfulLogin = this.effect((trigger$: Observable<void>) => trigger$.pipe(
    tap(() => {
      this.setLoadingState(true);
      this.snackbar.dismiss();
    }),
    // Perform failover checks before completing login
    switchMap(() => this.performFailoverChecksAndCompleteLogin()),
    filter((result) => result === LoginResult.Success),
    // Wait for user to be loaded
    switchMap(() => this.authService.user$.pipe(filter(Boolean))),
    switchMap(() => from(this.router.navigateByUrl(this.getRedirectUrl()))),
    catchError((error: unknown) => {
      this.setLoadingState(false);
      this.errorHandler.showErrorModal(error);
      return EMPTY;
    }),
  ));

  showSnackbar(message: string): void {
    this.snackbar.open(
      message,
      this.translate.instant('Close'),
      { duration: 4000, verticalPosition: 'bottom' },
    );
  }

  getRedirectUrl(): string {
    const redirectUrl = this.window.sessionStorage.getItem('redirectUrl');
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl, this.window.location.origin);
        url.searchParams.delete(tokenParam);
        return url.pathname + url.search;
      } catch {
        console.error('Invalid redirect URL:', redirectUrl);
      }
    }

    return '/dashboard';
  }

  private checkForLoginBanner(): Observable<string> {
    this.subscribeToLoginBannerUpdates();

    return this.api.call('system.advanced.login_banner').pipe(
      tap((loginBanner) => this.patchState({ loginBanner })),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of(initialState.loginBanner);
      }),
    );
  }

  private subscribeToLoginBannerUpdates(): void {
    this.actions$.pipe(ofType(loginBannerUpdated)).subscribe(({ loginBanner }) => {
      this.window.sessionStorage.removeItem('loginBannerDismissed');
      this.patchState({ loginBanner });
    });
  }

  private checkIfAdminPasswordSet(): Observable<boolean> {
    return this.api.call('user.has_local_administrator_set_up').pipe(
      tap((wasAdminSet) => this.patchState({ wasAdminSet })),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of(initialState.wasAdminSet);
      }),
    );
  }

  private handleLoginWithQueryToken(token: string): Observable<LoginResult> {
    this.authService.setQueryToken(token);

    return this.authService.loginWithToken().pipe(
      this.withFailoverValidation(),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of(LoginResult.NoAccess);
      }),
    );
  }

  private handleLoginWithToken(): Observable<LoginResult> {
    return this.tokenLastUsedService.isTokenWithinTimeline$.pipe(
      take(1),
      switchMap((isTokenWithinTimeline) => {
        if (!isTokenWithinTimeline) {
          this.authService.clearAuthToken();
          return of(LoginResult.NoToken);
        }

        if (!this.authService.hasAuthToken) {
          return of(LoginResult.NoToken);
        }

        return this.authService.loginWithToken().pipe(
          this.withFailoverValidation(),
        );
      }),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of(LoginResult.NoAccess);
      }),
    );
  }

  performFailoverChecksAndCompleteLogin(): Observable<LoginResult> {
    return this.failoverValidation.validateFailover().pipe(
      switchMap((result) => {
        if (result.success) {
          return this.completeLogin();
        }

        this.setLoadingState(false);
        this.showSnackbar(result.error || this.translate.instant('Failover validation failed.'));
        return of(LoginResult.NoAccess);
      }),
      catchError(() => {
        this.setLoadingState(false);
        const errorMsg = this.translate.instant(
          'Unable to check failover status. Please try again later or contact the system administrator.',
        );
        this.showSnackbar(errorMsg);
        return of(LoginResult.NoAccess);
      }),
    );
  }

  private completeLogin(): Observable<LoginResult> {
    return this.authService.initializeSession().pipe(
      tap((result) => {
        if (result === LoginResult.Success) {
          // Don't call handleSuccessfulLogin here - it would create a recursive loop
          // The navigation and cleanup is already handled in the handleSuccessfulLogin effect
        } else {
          this.setLoadingState(false);
          this.showSnackbar(this.translate.instant('Failed to initialize session.'));
        }
      }),
      catchError(() => {
        this.setLoadingState(false);
        this.showSnackbar(this.translate.instant('Failed to initialize session.'));
        return of(LoginResult.NoAccess);
      }),
    );
  }
}
