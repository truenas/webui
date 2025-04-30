import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy,
  Inject,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
} from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { DisconnectedMessageComponent } from 'app/pages/signin/disconnected-message/disconnected-message.component';
import { ReconnectMessage } from 'app/pages/signin/reconnect-message/reconnect-message.component';
import { SetAdminPasswordFormComponent } from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { TrueCommandStatusComponent } from 'app/pages/signin/true-command-status/true-command-status.component';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Component({
  selector: 'ix-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBar,
    MatCard,
    MatCardContent,
    IxIconComponent,
    SigninFormComponent,
    SetAdminPasswordFormComponent,
    TrueCommandStatusComponent,
    DisconnectedMessageComponent,
    AsyncPipe,
    TranslateModule,
    CopyrightLineComponent,
    ReconnectMessage,
  ],
  providers: [SigninStore],
})
export class SigninComponent {
  protected hasAuthToken = this.authService.hasAuthToken;
  protected isTokenWithinTimeline$ = this.tokenLastUsedService.isTokenWithinTimeline$;

  readonly wasAdminSet$ = this.signinStore.wasAdminSet$;
  readonly canLogin$ = this.signinStore.canLogin$;
  readonly isConnected$ = this.wsStatus.isConnected$;
  readonly isReconnectAllowed$ = this.wsStatus.isReconnectAllowed$;

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
    private wsStatus: WebSocketStatusService,
    private signinStore: SigninStore,
    private dialog: DialogService,
    private authService: AuthService,
    private tokenLastUsedService: TokenLastUsedService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.isConnected$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.signinStore.init();
      this.wsStatus.setReconnect(true);
    });

    this.signinStore.loginBanner$.pipe(
      filter(Boolean),
      filter(() => this.window.sessionStorage.getItem('loginBannerDismissed') !== 'true'),
      switchMap((text) => this.dialog.fullScreenDialog({
        message: text as TranslatedString,
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
