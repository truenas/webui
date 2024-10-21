import { AsyncPipe } from '@angular/common';
import {
  Component, OnInit, ChangeDetectionStrategy,
  Inject,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import {
  delay,
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DisconnectedMessageComponent } from 'app/pages/signin/disconnected-message/disconnected-message.component';
import { FailoverStatusComponent } from 'app/pages/signin/failover-status/failover-status.component';
import { SetAdminPasswordFormComponent } from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { TrueCommandStatusComponent } from 'app/pages/signin/true-command-status/true-command-status.component';
import { AuthService } from 'app/services/auth/auth.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Component({
  selector: 'ix-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    MatProgressSpinner,
    MatProgressBar,
    MatCard,
    MatCardContent,
    IxIconComponent,
    SigninFormComponent,
    SetAdminPasswordFormComponent,
    FailoverStatusComponent,
    TrueCommandStatusComponent,
    DisconnectedMessageComponent,
    AsyncPipe,
    TranslateModule,
    CopyrightLineComponent,
    TestDirective,
  ],
  providers: [SigninStore],
})
export class SigninComponent implements OnInit {
  protected hasAuthToken = this.authService.hasAuthToken;
  protected isTokenWithinTimeline$ = this.tokenLastUsedService.isTokenWithinTimeline$;

  readonly wasAdminSet$ = this.signinStore.wasAdminSet$;
  readonly failover$ = this.signinStore.failover$;
  readonly hasFailover$ = this.signinStore.hasFailover$;
  readonly canLogin$ = this.signinStore.canLogin$;
  readonly isConnected$ = this.wsManager.isConnected$;
  isConnectedDelayed$: Observable<boolean> = of(null).pipe(
    delay(1000),
    switchMap(() => this.isConnected$),
  );

  readonly hasLoadingIndicator$ = combineLatest([
    this.signinStore.isLoading$,
    this.isConnected$,
    this.isTokenWithinTimeline$,
  ]).pipe(
    map(([isLoading, isConnected, isTokenWithinTimeline]) => {
      return isLoading || !isConnected || (isTokenWithinTimeline && this.hasAuthToken);
    }),
  );

  constructor(
    private wsManager: WebSocketConnectionService,
    private signinStore: SigninStore,
    private dialog: DialogService,
    private authService: AuthService,
    private tokenLastUsedService: TokenLastUsedService,
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
      switchMap((text) => this.dialog.fullScreenDialog({
        message: text,
        showClose: true,
        pre: true,
      }).pipe(take(1))),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      // Restore focus on username input
      this.window.document?.querySelector<HTMLElement>('[ixAutofocus] input')?.focus();
    });
  }
}
