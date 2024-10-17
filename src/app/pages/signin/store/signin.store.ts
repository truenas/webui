import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { Actions, ofType } from '@ngrx/effects';
import { tapResponse } from '@ngrx/operators';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, EMPTY, forkJoin, Observable, of, Subscription, from,
} from 'rxjs';
import {
  catchError, distinctUntilChanged, filter, map, switchMap, take, tap,
} from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { UpdateService } from 'app/services/update.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { loginBannerUpdated } from 'app/store/system-config/system-config.actions';

interface SigninState {
  isLoading: boolean;
  wasAdminSet: boolean;
  failover: {
    status: FailoverStatus;
    ips?: string[];
    disabledReasons?: FailoverDisabledReason[];
  };
  loginBanner: string;
}

const initialState: SigninState = {
  isLoading: false,
  wasAdminSet: true,
  failover: null,
  loginBanner: null,
};

@UntilDestroy()
@Injectable()
export class SigninStore extends ComponentStore<SigninState> {
  loginBanner$ = this.select((state) => state.loginBanner);
  wasAdminSet$ = this.select((state) => state.wasAdminSet);
  failover$ = this.select((state) => state.failover);
  isLoading$ = this.select((state) => state.isLoading);
  failoverAllowsLogin$ = this.select((state) => {
    return [FailoverStatus.Single, FailoverStatus.Master].includes(state.failover?.status);
  });

  canLogin$ = combineLatest([this.wsManager.isConnected$, this.failoverAllowsLogin$]).pipe(
    map(([isConnected, failoverAllowsLogin]) => isConnected && failoverAllowsLogin),
    distinctUntilChanged(),
  );

  hasFailover$ = this.select((state) => {
    // Do not simplify to optional chaining.
    return state.failover && state.failover.status !== FailoverStatus.Single;
  });

  private failoverStatusSubscription: Subscription;
  private disabledReasonsSubscription: Subscription;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private tokenLastUsedService: TokenLastUsedService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private router: Router,
    private snackbar: MatSnackBar,
    private wsManager: WebSocketConnectionService,
    private errorHandler: ErrorHandlerService,
    private authService: AuthService,
    private updateService: UpdateService,
    private actions$: Actions,
    @Inject(WINDOW) private window: Window,
  ) {
    super(initialState);
  }

  setLoadingState = this.updater((state, isLoading: boolean) => ({ ...state, isLoading }));

  init = this.effect((trigger$: Observable<void>) => trigger$.pipe(
    tap(() => this.setLoadingState(true)),
    switchMap(() => forkJoin([
      this.checkIfAdminPasswordSet(),
      this.checkForLoginBanner(),
      this.loadFailoverStatus(),
      this.updateService.hardRefreshIfNeeded(),
    ])),
    tap(() => this.setLoadingState(false)),
    switchMap(() => this.handleLoginWithToken()),
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
    tap(() => {
      if (this.failoverStatusSubscription && !this.failoverStatusSubscription.closed) {
        this.failoverStatusSubscription.unsubscribe();
        this.failoverStatusSubscription = null;
      }
      if (this.disabledReasonsSubscription && !this.disabledReasonsSubscription.closed) {
        this.disabledReasonsSubscription.unsubscribe();
        this.disabledReasonsSubscription = null;
      }
    }),
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

  private setFailoverDisabledReasons = this.updater((state, disabledReasons: FailoverDisabledReason[]) => ({
    ...state,
    failover: {
      ...state.failover,
      disabledReasons,
    },
  }));

  private setFailoverStatus = this.updater((state, failover: FailoverStatus) => ({
    ...state,
    failover: {
      ...(state.failover || {}),
      status: failover,
    },
  }));

  private setFailoverIps = this.updater((state, ips: string[]) => ({
    ...state,
    failover: {
      ...state.failover,
      ips,
    },
  }));

  getRedirectUrl(): string {
    const redirectUrl = this.window.sessionStorage.getItem('redirectUrl');
    if (redirectUrl) {
      return redirectUrl;
    }

    return '/dashboard';
  }

  private checkForLoginBanner(): Observable<string> {
    this.subscribeToLoginBannerUpdates();

    return this.ws.call('system.advanced.login_banner').pipe(
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
    return this.ws.call('user.has_local_administrator_set_up').pipe(
      tap((wasAdminSet) => this.patchState({ wasAdminSet })),
      catchError((error) => {
        this.errorHandler.showErrorModal(error);
        return of(initialState.wasAdminSet);
      }),
    );
  }

  private loadFailoverStatus(): Observable<unknown> {
    return this.ws.call('failover.status').pipe(
      switchMap((status) => {
        this.setFailoverStatus(status);

        if (status === FailoverStatus.Single) {
          return of(null);
        }

        this.subscribeToFailoverUpdates();
        return this.loadAdditionalFailoverInfo();
      }),
      catchError((error) => {
        this.errorHandler.showErrorModal(error);
        return of(undefined);
      }),
    );
  }

  private loadAdditionalFailoverInfo(): Observable<unknown> {
    return forkJoin([
      this.ws.call('failover.get_ips'),
      this.ws.call('failover.disabled.reasons'),
    ])
      .pipe(
        tap(
          ([ips, reasons]: [string[], FailoverDisabledReason[]]) => {
            this.setFailoverDisabledReasons(reasons);
            this.setFailoverIps(ips);
          },
        ),
      );
  }

  private subscribeToFailoverUpdates(): void {
    this.failoverStatusSubscription = this.ws.subscribe('failover.status')
      .pipe(map((apiEvent) => apiEvent.fields), untilDestroyed(this))
      .subscribe(({ status }) => this.setFailoverStatus(status));

    this.disabledReasonsSubscription = this.ws.subscribe('failover.disabled.reasons')
      .pipe(map((apiEvent) => apiEvent.fields), untilDestroyed(this))
      .subscribe((event) => this.setFailoverDisabledReasons(event.disabled_reasons));
  }

  private handleLoginWithToken(): Observable<LoginResult> {
    return this.tokenLastUsedService.isTokenWithinTimeline$.pipe(take(1)).pipe(
      filter((isTokenWithinTimeline) => {
        if (!isTokenWithinTimeline) {
          this.authService.clearAuthToken();
        }

        return isTokenWithinTimeline;
      }),
      switchMap(() => this.authService.loginWithToken()),
      tap((loginResult) => {
        if (loginResult !== LoginResult.Success) {
          this.authService.clearAuthToken();
        } else {
          this.handleSuccessfulLogin();
        }
      }),
      tapResponse(
        () => {},
        (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      ),
    );
  }
}
