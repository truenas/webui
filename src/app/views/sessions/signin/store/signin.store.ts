import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  combineLatest, forkJoin, Observable, of,
} from 'rxjs';
import {
  delay, map, switchMap, tap,
} from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

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
    // TODO: Cache failover status in localstorage.
    // Do not simplify to optional chaining.
    return state.failover && state.failover.status !== FailoverStatus.Single;
  });

  private readonly tokenLifetime = 300;
  private statusSubscriptionId: string;
  private disabledReasonsSubscriptionId: string;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private router: Router,
    private snackbar: MatSnackBar,
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
      ])
        .pipe(
          switchMap(() => {
            // TODO: ws.token implicitly stores token in localStorage.
            if (!this.ws.token) {
              return of(null);
            }

            return this.loginWithToken();
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
    switchMap(() => this.generateToken()),
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
      (error: WebsocketError) => new EntityUtils().handleWsError(this, error, this.dialogService),
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

  private loginWithToken(): Observable<unknown> {
    return this.ws.loginToken(this.ws.token).pipe(
      tap(
        (wasLoggedIn) => {
          if (!wasLoggedIn) {
            this.showSnackbar(this.translate.instant('Token expired, please log back in.'));
            this.ws.token = null;
            this.setLoadingState(false);
            return;
          }

          this.handleSuccessfulLogin();
        },
      ),
    );
  }

  private generateToken(): Observable<string> {
    return this.ws.call('auth.generate_token', [this.tokenLifetime]).pipe(
      tap(
        (token) => {
          if (!token) {
            this.showSnackbar(this.translate.instant('Error generating token, please try again.'));
            return;
          }

          this.ws.token = token;
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
      delay(3000),
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
    // TODO: https://ixsystems.atlassian.net/browse/NAS-118104
    this.statusSubscriptionId = UUID.UUID();
    this.ws.sub<FailoverStatus>('failover.status', this.statusSubscriptionId)
      .pipe(untilDestroyed(this))
      .subscribe((status) => this.setFailoverStatus(status));

    this.disabledReasonsSubscriptionId = UUID.UUID();
    this.ws.sub<FailoverDisabledReason[]>('failover.disabled.reasons', this.disabledReasonsSubscriptionId)
      .pipe(untilDestroyed(this))
      .subscribe((disabledReasons) => {
        this.setFailoverDisabledReasons(disabledReasons);
      });
  }
}
