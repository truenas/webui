import { Inject, Injectable } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  combineLatest, forkJoin, Observable, of,
} from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { FailoverDisabledReasonEvent } from 'app/interfaces/failover-disabled-reasons.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';

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
    this.ws.isConnected$,
    this.select((state) => [FailoverStatus.Single, FailoverStatus.Master].includes(state.failover?.status)),
  ]).pipe(
    map(([isConnected, failoverAllowsLogin]) => isConnected && failoverAllowsLogin),
  );
  hasFailover$ = this.select((state) => {
    // Do not simplify to optional chaining.
    return state.failover && state.failover.status !== FailoverStatus.Single;
  });

  private readonly tokenLifetimeDefault = 300;
  private statusSubscriptionId: string;
  private disabledReasonsSubscriptionId: string;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private router: Router,
    private snackbar: MatSnackBar,
    private ws2: WebSocketService2,
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
      ])
        .pipe(
          switchMap(() => {
            this.updateFailoverStatusOnDisconnect();

            // TODO: ws.token implicitly stores token in localStorage.
            if (!this.ws.token) {
              return of(null);
            }

            return this.reLoginWithToken();
          }),
          tapResponse(
            () => this.setLoadingState(false),
            (error: WebsocketError) => {
              this.setLoadingState(false);
              new EntityUtils().handleWsError(this, error, this.dialogService);
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
    switchMap(() => this.authenticateWithTokenWs2()),
    switchMap(() => this.authenticateWithToken()),
    tapResponse(
      () => {
        if (this.statusSubscriptionId) {
          this.ws.unsub('failover.status', this.statusSubscriptionId);
        }
        if (this.disabledReasonsSubscriptionId) {
          this.ws.unsub('failover.disabled_reasons', this.disabledReasonsSubscriptionId);
        }
        this.router.navigateByUrl(this.getRedirectUrl());
      },
      (error: WebsocketError) => {
        this.setLoadingState(false);
        new EntityUtils().handleWsError(this, error, this.dialogService);
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

  setFailoverDisabledReasons = this.updater((state, disabledReasons: FailoverDisabledReason[]) => ({
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

  private reLoginWithToken(): Observable<unknown> {
    this.ws2.token2 = this.ws.token;
    return combineLatest([
      this.ws.loginWithToken(this.ws.token),
      this.ws2.call('auth.login_with_token', [this.ws2.token2]),
    ]).pipe(
      tap(([wasLoggedIn]) => {
        if (!wasLoggedIn) {
          this.showSnackbar(this.translate.instant('Token expired, please log back in.'));
          this.ws.token = null;
          this.setLoadingState(false);
          return;
        }
        this.handleSuccessfulLogin();
      }),
    );
  }

  private authenticateWithTokenWs2(): Observable<unknown> {
    const tokenLifetime = Number(this.window.localStorage.getItem('lifetime')) || this.tokenLifetimeDefault;
    return this.ws2.call('auth.generate_token', [tokenLifetime])
      .pipe(
        tap((token: string) => {
          if (!token) {
            return;
          }
          this.ws2.token2 = token;
        }),
        switchMap(() => this.ws2.call('auth.login_with_token', [this.ws2.token2])),
      );
  }

  private authenticateWithToken(): Observable<unknown> {
    const tokenLifetime = Number(this.window.localStorage.getItem('lifetime')) || this.tokenLifetimeDefault;
    return this.ws.call('auth.generate_token', [tokenLifetime]).pipe(
      tap(
        (token) => {
          if (!token) {
            throw new Error(this.translate.instant('Error generating token, please try again.'));
          }

          this.ws.token = token;
        },
      ),
      switchMap(() => this.ws.call('auth.login_with_token', [this.ws.token])),
      tap(
        (wasLoggedIn) => {
          if (!wasLoggedIn) {
            throw new Error(this.translate.instant('Error authenticating with token, please try again.'));
          }
        },
      ),
    );
  }

  getRedirectUrl(): string {
    const redirectUrl = this.window.sessionStorage.getItem('redirectUrl');
    if (redirectUrl) {
      return redirectUrl;
    }

    return '/dashboard';
  }

  private checkIfAdminPasswordSet(): Observable<boolean> {
    return this.ws.call('user.has_local_administrator_set_up').pipe(
      tap(
        (wasAdminSet) => this.patchState({ wasAdminSet }),
      ),
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
    this.statusSubscriptionId = UUID.UUID();
    this.ws.sub<FailoverStatus>('failover.status', this.statusSubscriptionId)
      .pipe(untilDestroyed(this))
      .subscribe((status) => this.setFailoverStatus(status));

    this.disabledReasonsSubscriptionId = UUID.UUID();
    this.ws.sub<FailoverDisabledReasonEvent>('failover.disabled.reasons', this.disabledReasonsSubscriptionId)
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        this.setFailoverDisabledReasons(event.disabled_reasons);
      });
  }

  /**
   * If websocket connection is lost because of failover event, we need to resubscribe to updates.
   */
  private updateFailoverStatusOnDisconnect(): void {
    this.ws.onClose$
      .pipe(
        switchMap(() => this.ws.isConnected$.pipe(filter(Boolean))),
        switchMap(() => this.loadFailoverStatus()),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
