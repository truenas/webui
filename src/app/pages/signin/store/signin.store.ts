import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { Actions, ofType } from '@ngrx/effects';
import { tapResponse } from '@ngrx/operators';
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
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
  loginBanner$ = this.select((state) => state.loginBanner);
  wasAdminSet$ = this.select((state) => state.wasAdminSet);
  isLoading$ = this.select((state) => state.isLoading);

  canLogin$ = this.wsStatus.isConnected$;

  private handleLoginResult = (loginResult: LoginResult): void => {
    if (loginResult !== LoginResult.Success) {
      this.authService.clearAuthToken();
    } else {
      this.handleSuccessfulLogin();
    }
  };

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private tokenLastUsedService: TokenLastUsedService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private router: Router,
    private snackbar: MatSnackBar,
    private errorHandler: ErrorHandlerService,
    private authService: AuthService,
    private updateService: UpdateService,
    private actions$: Actions,
    private wsStatus: WebSocketStatusService,
    private activatedRoute: ActivatedRoute,
    @Inject(WINDOW) private window: Window,
  ) {
    super(initialState);
  }

  setLoadingState = this.updater((state, isLoading: boolean) => ({ ...state, isLoading }));

  init = this.effect((trigger$: Observable<void>) => trigger$.pipe(
    tap(() => this.setLoadingState(true)),
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
  ));

  handleSuccessfulLogin = this.effect((trigger$: Observable<void>) => trigger$.pipe(
    tap(() => {
      this.setLoadingState(true);
      this.snackbar.dismiss();
    }),
    // Wait for user to be loaded
    switchMap(() => this.authService.user$.pipe(filter(Boolean))),
    switchMap(() => {
      // TODO: This is a hack to keep existing code working. Ideally it shouldn't be here.
      return this.systemGeneralService.loadProductType();
    }),
    switchMap(() => from(this.router.navigateByUrl(this.getRedirectUrl()))),
    catchError((error: unknown) => {
      this.setLoadingState(false);
      this.dialogService.error(this.errorHandler.parseError(error));
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
      } catch (error) {
        console.error('Invalid redirect URL:', redirectUrl);
      }
    }

    return '/dashboard';
  }

  private checkForLoginBanner(): Observable<string> {
    this.subscribeToLoginBannerUpdates();

    return this.api.call('system.advanced.login_banner').pipe(
      tap((loginBanner) => this.patchState({ loginBanner })),
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
      tap(this.handleLoginResult.bind(this)),
      tapResponse(
        () => {},
        (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      ),
    );
  }

  private handleLoginWithToken(): Observable<LoginResult> {
    return this.tokenLastUsedService.isTokenWithinTimeline$.pipe(
      take(1),
      filter((isTokenWithinTimeline) => {
        if (!isTokenWithinTimeline) {
          this.authService.clearAuthToken();
        }

        return isTokenWithinTimeline;
      }),
      switchMap(() => this.authService.loginWithToken()),
      tap(this.handleLoginResult.bind(this)),
      tapResponse(
        () => {},
        (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      ),
    );
  }
}
