import {
  Component, OnInit, ChangeDetectionStrategy,
  Inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest } from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

@UntilDestroy()
@Component({
  selector: 'ix-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninComponent implements OnInit {
  readonly managedByTrueCommand$ = this.signinStore.managedByTrueCommand$;
  readonly wasAdminSet$ = this.signinStore.wasAdminSet$;
  readonly failover$ = this.signinStore.failover$;
  readonly hasFailover$ = this.signinStore.hasFailover$;
  readonly canLogin$ = this.signinStore.canLogin$;
  readonly isConnected$ = this.wsManager.isConnected$;
  readonly hasLoadingIndicator$ = combineLatest([this.signinStore.isLoading$, this.isConnected$]).pipe(
    map(([isLoading, isConnected]) => isLoading || !isConnected),
  );

  constructor(
    private wsManager: WebSocketConnectionService,
    private signinStore: SigninStore,
    private dialog: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.isConnected$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.signinStore.init();
      });

    this.signinStore.loginBanner$.pipe(
      filter(Boolean),
      filter(() => this.window.sessionStorage.getItem('loginBannerDismissed') !== 'true'),
      switchMap((text) => this.dialog.fullScreenDialog(null, text, true, true).pipe(take(1))),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      // Restore focus on username input
      this.window.document?.querySelector<HTMLElement>('[ixAutofocus] input')?.focus();
    });
  }
}
