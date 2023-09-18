import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, forkJoin, Observable, of, Subscription,
} from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UpdateService } from 'app/services/update.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

interface SigninState {
  isLoading: boolean;
  wasAdminSet: boolean;
  failover: {
    status: FailoverStatus;
    ips?: string[];
    disabledReasons?: FailoverDisabledReason[];
  };
}

const initialState: SigninState = {
  isLoading: false,
  wasAdminSet: true,
  failover: null,
};

@UntilDestroy()
@Injectable()
export class SigninStore extends ComponentStore<SigninState> {
  wasAdminSet$ = this.select((state) => state.wasAdminSet);
  failover$ = this.select((state) => state.failover);
  isLoading$ = this.select((state) => state.isLoading);
  canLogin$ = combineLatest([
    this.wsManager.isConnected$,
    this.select((state) => [FailoverStatus.Single, FailoverStatus.Master].includes(state.failover?.status)),
  ]).pipe(
    map(([isConnected, failoverAllowsLogin]) => isConnected && failoverAllowsLogin),
  );
  hasFailover$ = this.select((state) => {
    // Do not simplify to optional chaining.
    return state.failover && state.failover.status !== FailoverStatus.Single;
  });

  private statusSubscription: Subscription;
  private disabledReasonsSubscription: Subscription;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private router: Router,
    private snackbar: MatSnackBar,
    private wsManager: WebsocketConnectionService,
    private errorHandler: ErrorHandlerService,
    private authService: AuthService,
    private updateService: UpdateService,
    @Inject(WINDOW) private window: Window,
  ) {
    super(initialState);
  }

  setLoadingState = this.updater((state, isLoading: boolean) => ({ ...state, isLoading }));

  init = this.effect((trigger$: Observable<void>) => trigger$.pipe(
    tap(() => this.setLoadingState(true)),
    switchMap(() => {
      return forkJoin([
        this.checkIfAdminPasswordSet(),
        this.loadFailoverStatus(),
        // TODO: This is a hack to keep existing code working. Ideally it shouldn't be here.
        this.systemGeneralService.loadProductType(),
      ]).pipe(
        tap(() => this.updateService.hardRefreshIfNeeded()),
        switchMap(() => this.authService.loginWithToken()),
        tap((wasLoggedIn: boolean) => {
          if (!wasLoggedIn) {
            this.authService.clearAuthToken();
            return;
          }
          this.handleSuccessfulLogin();
        }),
        tapResponse(
          () => {},
          (error: WebsocketError) => {
            this.dialogService.error(this.errorHandler.parseWsError(error));
          },
        ),
      );
    }),
  ));

  handleSuccessfulLogin = this.effect((trigger$: Observable<void>) => trigger$.pipe(
    tap(() => {
      this.setLoadingState(true);
      this.snackbar.dismiss();
    }),
    tapResponse(
      () => {
        this.setLoadingState(false);
        this.router.navigateByUrl(this.getRedirectUrl()).then(() => {
          if (this.statusSubscription && !this.statusSubscription.closed) {
            this.statusSubscription.unsubscribe();
            this.statusSubscription = null;
          }
          if (this.disabledReasonsSubscription && !this.disabledReasonsSubscription.closed) {
            this.disabledReasonsSubscription.unsubscribe();
            this.disabledReasonsSubscription = null;
          }
        });
      },
      (error: WebsocketError) => {
        this.setLoadingState(false);
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    ),
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

  private checkIfAdminPasswordSet(): Observable<boolean> {
    return this.ws.call('user.has_local_administrator_set_up').pipe(
      tap((wasAdminSet) => this.patchState({ wasAdminSet })),
    );
  }

  private loadFailoverStatus(): Observable<unknown> {
    return this.ws.call('failover.status').pipe(
      switchMap((status) => {
        this.setFailoverStatus(status);
        this.setLoadingState(false);

        if (status === FailoverStatus.Single) {
          return of(null);
        }

        this.subscribeToFailoverUpdates();
        return this.loadAdditionalFailoverInfo();
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
          ([ips, reasons]) => {
            this.setFailoverDisabledReasons(reasons);
            this.setFailoverIps(ips);
          },
        ),
      );
  }

  private subscribeToFailoverUpdates(): void {
    this.statusSubscription = this.ws.subscribe('failover.status')
      .pipe(map((apiEvent) => apiEvent.fields), untilDestroyed(this))
      .subscribe((status) => this.setFailoverStatus(status));

    this.disabledReasonsSubscription = this.ws.subscribe('failover.disabled.reasons')
      .pipe(map((apiEvent) => apiEvent.fields), untilDestroyed(this))
      .subscribe((event) => this.setFailoverDisabledReasons(event.disabled_reasons));
  }
}
