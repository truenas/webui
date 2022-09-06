import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, forkJoin, Observable, of,
} from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { WebSocketService } from 'app/services';

interface SigninState {
  isLoading: boolean;
  hasRootPassword: boolean;
  failover: {
    status: FailoverStatus;
    ips?: string[];
    disabledReasons?: FailoverDisabledReason[];
  };
}

const initialState: SigninState = {
  isLoading: false,
  hasRootPassword: true,
  failover: null,
};

@UntilDestroy()
@Injectable()
export class SigninStore extends ComponentStore<SigninState> {
  hasRootPassword$ = this.select((state) => state.hasRootPassword);
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

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private router: Router,
    private snackbar: MatSnackBar,
    @Inject(WINDOW) private window: Window,
  ) {
    super(initialState);
  }

  init(): void {
    this.setLoadingState(true);

    forkJoin([
      this.checkIfRootPasswordSet(),
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
        tap(() => this.setLoadingState(false)),
      )
      // TODO: Handle error.
      .subscribe();
  }

  setLoadingState = this.updater((state, isLoading: boolean) => ({ ...state, isLoading }));

  handleSuccessfulLogin(): void {
    this.setLoadingState(true);
    this.snackbar.dismiss();

    this.ws.call('auth.generate_token', [this.tokenLifetime]).pipe(untilDestroyed(this)).subscribe((token) => {
      if (!token) {
        // TODO: Handle
        return;
      }

      this.ws.token = token;
      this.router.navigateByUrl(this.getRedirectUrl());
    });
  }

  showSnackbar(message: string): void {
    this.snackbar.open(
      message,
      this.translate.instant('Close'),
      { duration: 4000, verticalPosition: 'bottom' },
    );
  }

  private loginWithToken(): Observable<unknown> {
    return this.ws.loginToken(this.ws.token).pipe(
      tapResponse(
        (wasLoggedIn) => {
          if (!wasLoggedIn) {
            // TODO: Handle
            this.showSnackbar(this.translate.instant('Token expired, please log back in.'));
            this.ws.token = null;
            this.setLoadingState(false);
            return;
          }

          this.handleSuccessfulLogin();
        },
        () => {
          // TODO: Handle
        },
      ),
    );
  }

  private getRedirectUrl(): string {
    if (this.ws.redirectUrl) {
      return this.ws.redirectUrl;
    }

    const currentUrl = this.window.sessionStorage.getItem('currentUrl');
    if (currentUrl) {
      return currentUrl;
    }

    return '/dashboard';
  }

  private checkIfRootPasswordSet(): Observable<boolean> {
    return this.ws.call('user.has_root_password').pipe(
      tapResponse(
        (hasRootPassword) => this.patchState({ hasRootPassword }),
        () => {}, // TODO: handle error
      ),
    );
  }

  private loadFailoverStatus(): Observable<unknown> {
    // TODO: Subscribe to updates.
    return this.ws.call('failover.status').pipe(
      switchMap((status) => {
        this.patchState({
          failover: { status },
        });

        if (status === FailoverStatus.Single) {
          return of(null);
        }

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
        tapResponse(
          ([ips, reasons]) => {
            this.patchState((state) => {
              return {
                ...state,
                failover: {
                  ...state.failover,
                  ips,
                  disabledReasons: reasons,
                },
              };
            });
          },
          () => {}, // TODO: Handle error.
        ),
      );
  }
}
