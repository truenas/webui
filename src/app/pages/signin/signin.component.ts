import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnIconComponent, TnProgressBarComponent } from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import {
  delay, filter, switchMap, take,
} from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { DisconnectedMessageComponent } from 'app/pages/signin/disconnected-message/disconnected-message.component';
import { SetAdminPasswordFormComponent } from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { TrueCommandStatusComponent } from 'app/pages/signin/true-command-status/true-command-status.component';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Component({
  selector: 'ix-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnProgressBarComponent,
    TnCardComponent,
    TnIconComponent,
    SigninFormComponent,
    SetAdminPasswordFormComponent,
    TrueCommandStatusComponent,
    DisconnectedMessageComponent,
    AsyncPipe,
    NgTemplateOutlet,
    TranslateModule,
    CopyrightLineComponent,
  ],
  providers: [SigninStore],
})
export class SigninComponent implements OnInit {
  private wsStatus = inject(WebSocketStatusService);
  private signinStore = inject(SigninStore);
  private dialog = inject(DialogService);
  private authService = inject(AuthService);
  private tokenLastUsedService = inject(TokenLastUsedService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  /** Read live: the token can be cleared while this page is up, as a refused token login does. */
  protected get hasAuthToken(): boolean {
    return this.authService.hasAuthToken;
  }

  protected readonly isTokenWithinTimeline = toSignal(this.tokenLastUsedService.isTokenWithinTimeline$, {
    initialValue: false,
  });

  protected readonly wasAdminSet = this.signinStore.wasAdminSet;
  protected readonly isLoggingIn = this.signinStore.isLoggingIn;
  protected readonly isLoggingInWithQueryToken = this.signinStore.isLoggingInWithQueryToken;
  protected readonly canLogin = this.signinStore.canLogin;
  private readonly isConnected$ = this.wsStatus.isConnected$;
  protected readonly isConnected = toSignal(this.isConnected$, { initialValue: false });
  protected isConnectedDelayed$: Observable<boolean> = of(null).pipe(
    delay(1000),
    switchMap(() => this.isConnected$),
  );

  protected readonly hasLoadingIndicator = computed(() => {
    return this.signinStore.isLoading()
      || !this.isConnected()
      || (this.isTokenWithinTimeline() && this.hasAuthToken);
  });

  /** What `hasLoadingIndicator` was on the effect's previous run, to spot it switching off. */
  private hadLoadingIndicator = false;

  constructor() {
    this.wsStatus.isFailoverRestart$
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.signinStore.init();
        this.wsStatus.setFailoverStatus(false);
      });

    effect(() => {
      const loginBanner = this.signinStore.loginBanner();
      if (!loginBanner || this.window.sessionStorage.getItem('loginBannerDismissed') === 'true') {
        return;
      }

      untracked(() => this.showLoginBanner(loginBanner));
    });

    effect(() => {
      if (this.isLoggingIn()) {
        // Let the message render before reaching for it.
        setTimeout(() => this.window.document.querySelector<HTMLElement>('.logging-in')?.focus());
      }
    });

    effect(() => {
      const hasLoadingIndicator = this.hasLoadingIndicator();
      if (this.hadLoadingIndicator && !hasLoadingIndicator) {
        // Let the form render before reaching for it.
        setTimeout(() => this.focusFirstInput());
      }
      this.hadLoadingIndicator = hasLoadingIndicator;
    });
  }

  ngOnInit(): void {
    this.isConnected$
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Check if this is after a system update - reload page to get latest UI
        const isUpdateRestart = this.window.sessionStorage.getItem('updateCompleted') === 'true';
        if (isUpdateRestart) {
          this.window.sessionStorage.removeItem('updateCompleted');
          this.window.location.reload();
          return;
        }

        this.signinStore.init();
      });
  }

  private showLoginBanner(text: string): void {
    this.dialog.fullScreenDialog({
      message: text as TranslatedString,
      showClose: true,
      pre: true,
    }).pipe(
      take(1),
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.focusFirstInput();
    });
  }

  private focusFirstInput(): void {
    if (this.window.document.querySelector('ix-full-screen-dialog')) {
      return;
    }

    this.window.document.querySelector<HTMLElement>('input')?.focus();
  }
}
