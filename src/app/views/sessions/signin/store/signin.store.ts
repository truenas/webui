import { Inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
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

  constructor(
    private ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
  ) {
    super(initialState);
  }

  init(): void {
    this.patchState({ isLoading: true });

    forkJoin([
      this.checkIfRootPasswordSet(),
      this.loadFailoverStatus(),
    ])
      .pipe(
        // TODO: Handle error.
        // TODO: Attempt to login via token
        tap(() => this.patchState({ isLoading: false })),
      )
      .subscribe();
  }

  getRedirectUrl(): string {
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
