import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, input, output, signal, inject, computed, effect,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnCardComponent, TnDialog, TnFormFieldComponent, TnInputComponent,
  TnProgressBarComponent,
} from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  Observable, of, EMPTY, TimeoutError,
  combineLatest, map,
} from 'rxjs';
import {
  catchError, defaultIfEmpty,
  filter, finalize, switchMap, take, tap, timeout,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { verifyTotp } from 'app/helpers/totp.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { PendingTwoFactorKind, PendingTwoFactorService } from 'app/modules/auth/pending-two-factor.service';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';
import { twoFactorElements } from 'app/pages/two-factor-auth/two-factor.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * How long the load waits before calling the read failed.
 *
 * `defaultIfEmpty` only fires on completion, and two of the three sources never complete:
 * `user$` is a BehaviorSubject, and `getGlobalTwoFactorConfig()` switchMaps over another
 * one, so an inner call that ends without a result leaves the whole load hanging rather
 * than empty. Since this flag now disables every secret button, a hang is a permanently
 * inert card — so the load needs a terminal outcome even when nothing downstream provides
 * one. The bound is a judgement call: long enough not to fire on a slow appliance, short
 * enough that nobody stares at a dead card.
 */
const loadTimeoutMs = 30_000;

@Component({
  selector: 'ix-two-factor',
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    UiSearchDirective,
    TnProgressBarComponent,
    NgxSkeletonLoaderModule,
    TnBannerComponent,
    TnButtonComponent,
    TnFormFieldComponent,
    TnInputComponent,
    QrViewerComponent,
    ReactiveFormsModule,
    TranslateModule,
    AsyncPipe,
    CopyButtonComponent,
  ],
})
export class TwoFactorComponent implements OnInit {
  readonly isSetupDialog = input(false);
  readonly skipSetup = output();

  /**
   * Mirrors {@link isSetupComplete} for hosts that gate their own "done" affordance on
   * it — the first-login dialog's Finish button, which must not appear while a secret
   * is still waiting to be confirmed.
   */
  readonly setupComplete = output<boolean>();

  authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  protected tnDialog = inject(TnDialog);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private pendingTwoFactor = inject(PendingTwoFactorService);
  private formBuilder = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = twoFactorElements;

  userTwoFactorAuthConfigured = signal(false);
  protected isDataLoading = signal(false);
  protected isFormLoading = signal(false);
  globalTwoFactorEnabled = signal(false);

  /**
   * Whether {@link globalTwoFactorEnabled} holds something the page actually read.
   *
   * After a failed load it holds its `false` default, and `loadFailed` cannot stand in
   * for that — a later successful read of the *account* clears it while the global config
   * is still unknown. Saying "2FA is not enabled on this system" from a default is the
   * one sentence that tells the user whether scanning the QR matters at all.
   */
  private globalConfigKnown = signal(false);
  currentSessionIs2fa = signal(false);
  protected pendingVerification = signal(false);

  /**
   * Set when the load could not read the account or the global config.
   *
   * Without it the banner keeps rendering from field defaults, which reads as a
   * confident "2FA is not enabled on this system" — a statement the page has no basis
   * for and which invites the user to act on it.
   *
   * Cleared by {@link setSecretConfigured} rather than only by a reload: the load is not
   * the page's last chance to learn the account state, and leaving it set would shadow
   * every later banner — including the one explaining what the code field is for.
   */
  private loadFailed = signal(false);

  /** Which path opened the confirmation step — decides how destructive cancelling is. */
  private pendingKind = signal<PendingTwoFactorKind>('setup');

  /** Account the persisted pending flag is keyed to; empty until `user$` resolves. */
  private username = signal('');

  /**
   * The appliance's own OTP tolerance, in time steps either side of the current one.
   * The confirmation check has to use it rather than its own default, or it can accept
   * a code login will reject — the exact outcome this step exists to prevent.
   */
  private toleranceWindow = signal(0);

  /**
   * Appliance clock minus browser clock, in milliseconds.
   *
   * TOTP works because the authenticator and the appliance are both NTP-synced; the
   * browser is a third clock with no part in the real exchange. Checking against it
   * would reject the very code login accepts whenever the workstation has drifted —
   * and with Renew and Unset hidden, the only offered way out is Cancel Setup. Reading
   * the appliance's own time makes this check ask the same question login will.
   */
  private clockOffset = signal(0);

  protected readonly verificationForm = this.formBuilder.nonNullable.group({
    otp: ['', Validators.required],
  });

  protected readonly showSkipButton = computed(() => {
    return this.isSetupDialog() && !this.userTwoFactorAuthConfigured();
  });

  private readonly isSetupComplete = computed(() => {
    return this.userTwoFactorAuthConfigured() && !this.pendingVerification();
  });

  /**
   * Whether there is a secret on the account still waiting to be confirmed.
   *
   * Narrower than `pendingVerification()`: the marker is written before the call that
   * mints the secret, so a failed renew leaves the step showing with no secret behind
   * it. Only the narrow case should take away Renew and Unset — the rationale for
   * hiding them (renewing would just replace one unconfirmed secret with another) does
   * not hold when there is nothing to replace, and hiding them there would leave
   * Cancel Setup as the only control on the page.
   */
  protected readonly hasUnconfirmedSecret = computed(() => {
    return this.pendingVerification() && this.userTwoFactorAuthConfigured();
  });

  protected get global2FaMsg(): string {
    if (this.loadFailed()) {
      return this.translate.instant(helptext2fa.loadFailed);
    }
    if (this.pendingVerification()) {
      const pending = this.translate.instant(this.pendingMessage());
      // The banner shows one message, and the paragraph that normally carries this caveat
      // is gated on the same flag — so without this the page drops the one fact the user
      // needs and keeps the claim that overstates what just happened.
      return this.isKnownGloballyDisabled()
        ? `${pending} ${this.translate.instant(helptext2fa.verification.notActiveGlobally)}`
        : pending;
    }
    if (!this.globalConfigKnown()) {
      // Same reason: every remaining branch asserts something about the system-wide
      // setting, and the page has not read it.
      return this.translate.instant(helptext2fa.loadFailed);
    }
    if (!this.globalTwoFactorEnabled()) {
      return this.translate.instant(helptext2fa.globallyDisabled);
    }
    if (this.userTwoFactorAuthConfigured() && !this.currentSessionIs2fa()) {
      return this.translate.instant(helptext2fa.firstSetUp);
    }
    if (this.userTwoFactorAuthConfigured() && this.currentSessionIs2fa()) {
      return this.translate.instant(helptext2fa.allSetUp);
    }
    return this.translate.instant(helptext2fa.enabledGloballyButNotForUser);
  }

  private isKnownGloballyDisabled(): boolean {
    return this.globalConfigKnown() && !this.globalTwoFactorEnabled();
  }

  private pendingMessage(): string {
    if (!this.userTwoFactorAuthConfigured()) {
      return helptext2fa.verification.pendingUnknown;
    }

    return this.pendingKind() === 'renewal'
      ? helptext2fa.verification.pendingRenewal
      : helptext2fa.verification.pending;
  }

  protected get statusBannerType(): 'warning' | 'success' {
    const isSettled = this.globalTwoFactorEnabled() && this.userTwoFactorAuthConfigured();
    return isSettled && !this.pendingVerification() && !this.loadFailed() ? 'success' : 'warning';
  }

  readonly helptext = helptext2fa;

  /**
   * Rebuilt on language change: `instant` at field initialisation would freeze this
   * message in whichever language was active when the component was constructed, while
   * every other string on the page follows a runtime switch.
   */
  private readonly langChange = toSignal(this.translate.onLangChange, { initialValue: null });

  protected readonly otpErrorMessages = computed(() => {
    this.langChange();
    return {
      invalidOtp: this.translate.instant(helptext2fa.verification.invalid),
      unreadableSecret: this.translate.instant(helptext2fa.verification.unreadableSecret),
      checkFailed: this.translate.instant(helptext2fa.verification.checkFailed),
    };
  });

  readonly labels = {
    secret: helptext2fa.secret.label,
    uri: helptext2fa.uri.label,
  };

  readonly tooltips = {
    secret: helptext2fa.secret.tooltip,
    uri: helptext2fa.uri.tooltip,
  };

  constructor() {
    effect(() => this.setupComplete.emit(this.isSetupComplete()));
  }

  ngOnInit(): void {
    this.loadTwoFactorConfigs();
  }

  private loadTwoFactorConfigs(): void {
    this.isDataLoading.set(true);
    this.loadFailed.set(false);
    // A call can complete WITHOUT emitting, not just error: a clean websocket reconnect
    // completes the response stream, so an in-flight call ends silently and combineLatest
    // completes with it — leaving the card rendering field defaults that state 2FA is off
    // for a user who has it on, with no error anywhere. `defaultIfEmpty` turns that into a
    // value this can recognise.
    //
    // Only the bare `system.info` call can reach that today: the other two are piped off
    // BehaviorSubjects that never complete, so they either emit or hang, and `timeout` is
    // what covers them. Their guards are belt-and-braces against those shapes changing.
    combineLatest([
      // The whole user, not just userTwoFactorConfig$: the persisted pending flag is
      // keyed to the account name, which only the user record carries.
      this.authService.user$.pipe(filter(Boolean), take(1), defaultIfEmpty(null as LoggedInUser | null)),
      this.authService.getGlobalTwoFactorConfig()
        .pipe(take(1), defaultIfEmpty(null as GlobalTwoFactorConfig | null)),
      // The clock read alone is genuinely optional: without it the check falls back to
      // the browser clock, which is where it stood before.
      this.api.call('system.info')
        .pipe(catchError(() => of(null)), defaultIfEmpty(null as SystemInfo | null)),
    ])
      .pipe(
        take(1),
        // Covers the sources `defaultIfEmpty` cannot, which never complete at all.
        timeout(loadTimeoutMs),
        // finalize, not a line in `next`: this flag disables every secret button, so a
        // stream that errors or completes without emitting would leave the page inert
        // with no error on screen.
        finalize(() => this.isDataLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ([user, globalConfig, systemInfo]) => {
          if (!user || !globalConfig) {
            // Say the settings could not be read, rather than showing defaults that read
            // as "2FA is off here" and inviting the user to act on them.
            this.loadFailed.set(true);
            this.errorHandler.showErrorModal(new Error(this.translate.instant(helptext2fa.loadFailed)));
            return;
          }

          this.username.set(user.pw_name);
          this.globalTwoFactorEnabled.set(globalConfig.enabled);
          this.globalConfigKnown.set(true);
          this.toleranceWindow.set(globalConfig.window);
          this.clockOffset.set(systemInfo ? systemInfo.datetime.$date - Date.now() : 0);

          // The user here is a snapshot taken when this load was subscribed, before the
          // round trips above resolved. A renew that started in the meantime has already
          // moved the page past it, so applying the snapshot would roll that back —
          // clearing the marker it just wrote and leaving an armed secret looking settled.
          // The secret buttons are disabled while loading so this should not be reachable
          // through the UI; it stays because the cost of being wrong here is a lockout.
          if (this.pendingVerification()) {
            return;
          }

          this.setSecretConfigured(user.two_factor_config.secret_configured);

          // A stored flag without a secret behind it is stale — the secret was unset
          // elsewhere. Drop it rather than leave it for the next read.
          const kind = this.pendingTwoFactor.get(user.pw_name);
          const isPending = user.two_factor_config.secret_configured && !!kind;
          this.setPendingVerification(isPending, kind ?? 'setup');
        },
        error: (error: unknown) => {
          // Same reason as the empty-read branch: without this the banner keeps asserting
          // that 2FA is off here, which the page has no basis for saying.
          this.loadFailed.set(true);
          // The timeout is the likeliest arrival here, and its message is RxJS's
          // untranslated "Timeout has occurred" — say the same thing the banner says.
          const isTimeout = error instanceof TimeoutError;
          this.errorHandler.showErrorModal(
            isTimeout ? new Error(this.translate.instant(helptext2fa.loadFailed)) : error,
          );
        },
      });

    this.api.call('auth.sessions').pipe(
      map((sessionsList) => sessionsList.find((session) => {
        return session.current && session.credentials === CredentialType.TwoFactor;
      })),
    ).subscribe((session) => this.currentSessionIs2fa.set(!!session));
  }

  protected renewSecretOrEnable2Fa(): void {
    // Captured before the call, which sets `userTwoFactorAuthConfigured` unconditionally.
    //
    // While the load failed that signal holds its default rather than a fact, so a blind
    // page counts as "may already have a secret". The asymmetry decides it: labelling a
    // real renewal as a first-time setup withholds the one sentence that says the old
    // secret is already gone, whereas the reverse only over-warns someone who had nothing
    // to lose.
    const mayHaveSecret = this.userTwoFactorAuthConfigured() || this.loadFailed();
    const kind: PendingTwoFactorKind = mayHaveSecret ? 'renewal' : 'setup';

    this.getConfirmation(mayHaveSecret).pipe(
      filter(Boolean),
      switchMap(() => this.renewSecretForUser(kind)),
      catchError((error: unknown) => {
        this.rereadSecretState();
        return this.handleError(error);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  /**
   * Re-reads the account after a renew that did not complete.
   *
   * The call may have rotated the secret before its reply was lost, in which case the QR
   * still on screen points at a secret the account no longer holds — so the user would
   * scan the superseded one. The template follows `userTwoFactorConfig$`, so refreshing
   * updates the code as well as the flag that gates it. Best effort: if this fails too
   * the marker stays set, which is the safe direction.
   */
  private rereadSecretState(): void {
    this.authService.refreshUser().pipe(
      switchMap(() => this.authService.user$.pipe(filter(Boolean), take(1))),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((user) => this.setSecretConfigured(user.two_factor_config.secret_configured));
  }

  /**
   * Confirms the code the user read off their authenticator app.
   *
   * The check runs in the browser against the secret the QR code carries: the
   * middleware has no endpoint that validates a code without also arming the secret,
   * and the authoritative check happens at login regardless. What this buys is the
   * guarantee the reporter asked for — that nobody leaves this page with 2FA armed
   * against a secret their app never received.
   */
  protected onVerifyOtp(): void {
    // Re-run the validators first: `checkFailed` and `unreadableSecret` are set by hand
    // and both ask the user to retry the same code, so leaving them on the control would
    // make the guard below swallow the retry the message just invited.
    this.verificationForm.controls.otp.updateValueAndValidity();

    if (this.verificationForm.invalid) {
      this.verificationForm.controls.otp.markAsTouched();
      return;
    }

    // Screen against the cached secret before going to the network. A wrong code is the
    // ordinary case, and the re-read below calls `refreshUser()`, which pushes a
    // transient null through the app-wide `user$` — consumers that read it unguarded
    // blink while it is in flight. A typo should not cost that, or a round trip.
    //
    // `take(1)` on `user$` without `filter`, so a null current value is an answer rather
    // than a wait: being blind means there is nothing to screen against, and the re-read
    // is exactly what that case needs.
    this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        return user ? this.authService.userTwoFactorConfig$.pipe(take(1)) : of(null as UserTwoFactorConfig | null);
      }),
      defaultIfEmpty(null as UserTwoFactorConfig | null),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((cached) => {
      const cachedSecret = this.getProvisioningUriSecret(cached?.provisioning_uri ?? null);

      // Only reject cheaply on a secret we could actually read: an unreadable cached one
      // may simply be stale, and the re-read is what resolves that.
      if (cached && cachedSecret && !this.isCodeValidFor(cached, cachedSecret)) {
        this.verificationForm.controls.otp.setErrors({ invalidOtp: true });
        return;
      }

      this.confirmAgainstAccount();
    });
  }

  /**
   * Confirms an apparently-good code against what the account actually holds.
   *
   * The cached config is not the last word: a renew whose reply was lost may have rotated
   * the secret server-side without this page hearing about it, and confirming against the
   * superseded one would clear the marker and report success for a secret the account no
   * longer has — the lockout this step exists to prevent.
   */
  private confirmAgainstAccount(): void {
    this.isFormLoading.set(true);

    this.authService.refreshUser().pipe(
      switchMap(() => this.authService.userTwoFactorConfig$.pipe(take(1))),
      // A clean reconnect completes an in-flight call without emitting, which is neither
      // a value nor an error — without this the press would produce no message and no
      // change, indistinguishable from being ignored.
      defaultIfEmpty(null as UserTwoFactorConfig | null),
      catchError(() => of(null as UserTwoFactorConfig | null)),
      // While this flag is on, Confirm Code and Cancel Setup are disabled and
      // Renew/Unset/Skip are not rendered at all — a card with no working control,
      // inside a dialog opened with disableClose.
      finalize(() => this.isFormLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      if (!config) {
        this.verificationForm.controls.otp.setErrors({ checkFailed: true });
        return;
      }

      const secret = this.getProvisioningUriSecret(config.provisioning_uri);
      if (!secret) {
        // Nothing to check the code against, and no QR on screen either — telling the
        // user to re-scan or check their clock would send them after the wrong thing.
        this.verificationForm.controls.otp.setErrors({ unreadableSecret: true });
        return;
      }

      if (!this.isCodeValidFor(config, secret)) {
        this.verificationForm.controls.otp.setErrors({ invalidOtp: true });
        return;
      }

      // The re-read above is the freshest word on the account; dropping it would let the
      // card report a confirmed secret and still offer Configure, with the QR hidden and
      // Finish never appearing in the first-login dialog.
      this.setSecretConfigured(config.secret_configured);
      this.setPendingVerification(false);
      this.verificationForm.reset();
      this.snackbar.success(this.translate.instant(helptext2fa.verification.verified));
    });
  }

  private isCodeValidFor(config: UserTwoFactorConfig, secret: string): boolean {
    return verifyTotp(secret, this.verificationForm.controls.otp.value, {
      interval: config.interval,
      digits: config.otp_digits,
      window: this.toleranceWindow(),
      now: Date.now() + this.clockOffset(),
    });
  }

  protected onCancelVerification(): void {
    const isRenewal = this.pendingKind() === 'renewal';

    this.dialogService.confirm({
      title: this.translate.instant(helptext2fa.verification.cancel.title),
      message: this.translate.instant(
        isRenewal ? helptext2fa.verification.cancel.renewalMessage : helptext2fa.verification.cancel.message,
      ),
      buttonText: this.translate.instant(helptext2fa.verification.cancel.btn),
      cancelText: this.translate.instant(helptext2fa.verification.cancel.cancelBtn),
      hideCheckbox: true,
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.unsetSecretForUser()),
      catchError((error: unknown) => this.handleError(error)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  /**
   * The URI is `null` on an account with no secret — including while the confirmation
   * step is showing after a renew that failed before arming one — and `new URL(null)`
   * throws, which inside a subscribe handler would leave Confirm Code doing nothing at
   * all. Callers turn a `null` into the `unreadableSecret` message, which points at
   * generating a fresh secret rather than at re-scanning a QR code that is not on screen.
   */
  protected getProvisioningUriSecret(uri: string | null): string | null {
    if (!uri) {
      return null;
    }

    try {
      return new URLSearchParams(new URL(uri).search).get('secret');
    } catch {
      return null;
    }
  }

  private handleError(error: unknown): Observable<boolean> {
    this.isFormLoading.set(false);
    this.errorHandler.showErrorModal(error);

    return EMPTY;
  }

  private renewSecretForUser(kind: PendingTwoFactorKind): Observable<void> {
    return this.authService.user$.pipe(
      // `filter` before `take`, not after: `refreshUser()` pushes `null` onto `user$`
      // before re-fetching, so a failed refresh leaves `null` as the current value and
      // `take(1)` would grab it, drop it, and complete having done nothing — stranding
      // the loading flag on and every button disabled. This waits for a real user.
      filter((user) => !!user),
      take(1),
      tap((user) => {
        this.isFormLoading.set(true);
        this.currentSessionIs2fa.set(false);
        this.verificationForm.reset();
        this.username.set(user.pw_name);
        // Marked before the call, not after it. `renew_2fa_secret` arms the secret
        // server-side, so a call that times out having actually succeeded — or whose
        // `refreshUser` follow-up fails — would otherwise leave an armed secret with
        // nothing recording that it is unconfirmed, and the next load would present it
        // as finished setup. Being wrongly pending is recoverable: the stale sweep in
        // loadTwoFactorConfigs drops the flag when no secret materialised, and on the
        // renewal path the user clears it by entering a code. Being wrongly finished is
        // the failure this whole step exists to prevent.
        this.setPendingVerification(true, kind);
      }),
      switchMap((user) => this.api.call('user.renew_2fa_secret', [user.pw_name, { interval: 30, otp_digits: 6 }])),
      switchMap(() => this.authService.refreshUser()),
      tap(() => this.setSecretConfigured(true)),
      // See onVerifyOtp: a silent completion would otherwise strand the flag on.
      finalize(() => this.isFormLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private getConfirmation(mayHaveSecret: boolean): Observable<boolean> {
    if (mayHaveSecret) {
      return this.dialogService.confirm({
        title: this.translate.instant(helptext2fa.renewSecret.title),
        message: this.translate.instant(helptext2fa.renewSecret.message),
        hideCheckbox: true,
        buttonText: this.translate.instant(helptext2fa.renewSecret.btn),
      });
    }
    return of(true);
  }

  protected onSkipSetup(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Skip Two-Factor Authentication Setup?'),
      message: this.translate.instant(
        'Two-factor authentication significantly improves the security of your account. '
        + 'Are you sure you want to skip this setup? You can enable it later from your user settings.',
      ),
      buttonText: this.translate.instant('Skip Setup'),
      cancelText: this.translate.instant('Continue Setup'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.skipSetup.emit();
    });
  }

  protected unset2FaSecret(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Unset Two-Factor Authentication?'),
      message: this.translate.instant(
        'Are you sure you want to unset two-factor authentication? '
        + 'This will remove your current 2FA configuration and you will need to set it up again to use 2FA.',
      ),
      buttonText: this.translate.instant('Unset 2FA'),
      cancelText: this.translate.instant('Cancel'),
      hideCheckbox: true,
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.unsetSecretForUser()),
      catchError((error: unknown) => this.handleError(error)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private unsetSecretForUser(): Observable<undefined> {
    return this.authService.user$.pipe(
      // See renewSecretForUser: `filter` first, and the loading flag only once a real
      // user is in hand, so Cancel Setup cannot leave the page spinning with no exit.
      filter((user) => !!user),
      take(1),
      tap(() => this.isFormLoading.set(true)),
      switchMap((user) => this.api.call('user.unset_2fa_secret', [user.pw_name])),
      switchMap(() => this.authService.refreshUser()),
      tap(() => {
        this.setSecretConfigured(false);
        this.currentSessionIs2fa.set(false);
        this.setPendingVerification(false);
        this.verificationForm.reset();
      }),
      // See onVerifyOtp: a silent completion would otherwise strand the flag on.
      finalize(() => this.isFormLoading.set(false)),
    );
  }

  /**
   * Records account state learned from a fresh read — which also means the page is no
   * longer blind, so it stops saying the settings could not be read.
   */
  private setSecretConfigured(isConfigured: boolean): void {
    this.userTwoFactorAuthConfigured.set(isConfigured);
    this.loadFailed.set(false);
  }

  private setPendingVerification(isPending: boolean, kind: PendingTwoFactorKind = 'setup'): void {
    this.pendingVerification.set(isPending);
    this.pendingKind.set(kind);

    if (isPending) {
      this.pendingTwoFactor.set(this.username(), kind);
    } else {
      this.pendingTwoFactor.clear(this.username());
    }
  }
}
