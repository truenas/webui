import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, input, output, signal, inject, computed, effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnCardComponent, TnDialog, TnFormFieldComponent, TnInputComponent,
  TnProgressBarComponent,
} from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  Observable, of, EMPTY,
  combineLatest, map,
} from 'rxjs';
import {
  catchError,
  filter, switchMap, take, tap,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { verifyTotp } from 'app/helpers/totp.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';
import { twoFactorElements } from 'app/pages/two-factor-auth/two-factor.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Set while a secret exists that the user has not yet proven their authenticator app
 * holds. Persisted rather than kept in memory so a reload, a navigation away, or a
 * browser crash lands the user back on the confirmation step — with the QR code and
 * the escape hatch — instead of on a page that claims the setup is finished.
 *
 * Suffixed with the account name because nothing clears this on logout: on a shared
 * workstation an origin-wide key would put the next user into a confirmation step for
 * a secret that was never theirs, with Renew and Unset hidden behind it.
 *
 * Being browser state, the guarantee is per browser, not per account: generate a secret
 * here and open the page in another browser (or a private window, or after a storage
 * clear) and it reports the setup as settled, because `secret_configured` is all the
 * server can tell us. Closing that needs the middleware pending-secret API — until then
 * this covers the case the report was actually about, a crash or a navigation away.
 *
 * The stored value also records which path opened the step, because cancelling a renewal
 * is destructive in a way cancelling a first-time setup is not.
 */
const pendingVerificationKeyPrefix = 'pending2FaVerification';

type PendingKind = 'setup' | 'renewal';

const pendingKinds: PendingKind[] = ['setup', 'renewal'];

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
  private formBuilder = inject(FormBuilder);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = twoFactorElements;

  userTwoFactorAuthConfigured = signal(false);
  protected isDataLoading = signal(false);
  protected isFormLoading = signal(false);
  globalTwoFactorEnabled = signal(false);
  currentSessionIs2fa = signal(false);
  protected pendingVerification = signal(false);

  /** Which path opened the confirmation step — decides how destructive cancelling is. */
  private pendingKind = signal<PendingKind>('setup');

  /** Account the persisted pending flag is keyed to; empty until `user$` resolves. */
  private username = signal('');

  /**
   * The appliance's own OTP tolerance, in time steps either side of the current one.
   * The confirmation check has to use it rather than its own default, or it can accept
   * a code login will reject — the exact outcome this step exists to prevent.
   */
  private toleranceWindow = signal(0);

  protected readonly verificationForm = this.formBuilder.nonNullable.group({
    otp: ['', Validators.required],
  });

  protected readonly showSkipButton = computed(() => {
    return this.isSetupDialog() && !this.userTwoFactorAuthConfigured();
  });

  private readonly isSetupComplete = computed(() => {
    return this.userTwoFactorAuthConfigured() && !this.pendingVerification();
  });

  protected get global2FaMsg(): string {
    if (this.pendingVerification()) {
      return this.translate.instant(
        this.pendingKind() === 'renewal' ? helptext2fa.verification.pendingRenewal : helptext2fa.verification.pending,
      );
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

  protected get statusBannerType(): 'warning' | 'success' {
    const isSettled = this.globalTwoFactorEnabled() && this.userTwoFactorAuthConfigured();
    return isSettled && !this.pendingVerification() ? 'success' : 'warning';
  }

  readonly helptext = helptext2fa;

  protected readonly otpErrorMessages = {
    invalidOtp: this.translate.instant(helptext2fa.verification.invalid),
  };

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
    combineLatest([
      // The whole user, not just userTwoFactorConfig$: the persisted pending flag is
      // keyed to the account name, which only the user record carries.
      this.authService.user$.pipe(filter(Boolean), take(1)),
      this.authService.getGlobalTwoFactorConfig(),
    ])
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([user, globalConfig]) => {
          this.isDataLoading.set(false);
          this.username.set(user.pw_name);
          this.userTwoFactorAuthConfigured.set(user.two_factor_config.secret_configured);
          this.globalTwoFactorEnabled.set(globalConfig.enabled);
          this.toleranceWindow.set(globalConfig.window);

          // A stored flag without a secret behind it is stale — the secret was unset
          // elsewhere. Drop it rather than leave it for the next read.
          const stored = this.window.localStorage.getItem(this.pendingVerificationKey());
          const kind = pendingKinds.find((candidate) => candidate === stored);
          const isPending = user.two_factor_config.secret_configured && !!kind;
          this.setPendingVerification(isPending, kind);
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
    const kind: PendingKind = this.userTwoFactorAuthConfigured() ? 'renewal' : 'setup';

    this.getConfirmation().pipe(
      filter(Boolean),
      switchMap(() => this.renewSecretForUser(kind)),
      tap(() => this.isFormLoading.set(false)),
      catchError((error: unknown) => this.handleError(error)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
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
    if (this.verificationForm.invalid) {
      this.verificationForm.controls.otp.markAsTouched();
      return;
    }

    this.authService.userTwoFactorConfig$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      const secret = this.getProvisioningUriSecret(config.provisioning_uri);
      const isValid = !!secret && verifyTotp(secret, this.verificationForm.controls.otp.value, {
        interval: config.interval,
        digits: config.otp_digits,
        window: this.toleranceWindow(),
      });

      if (!isValid) {
        this.verificationForm.controls.otp.setErrors({ invalidOtp: true });
        return;
      }

      this.setPendingVerification(false);
      this.verificationForm.reset();
      this.snackbar.success(this.translate.instant(helptext2fa.verification.verified));
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

  protected getProvisioningUriSecret(uri: string): string | null {
    const url = new URL(uri);
    const params = new URLSearchParams(url.search);

    return params.get('secret');
  }

  private handleError(error: unknown): Observable<boolean> {
    this.isFormLoading.set(false);
    this.errorHandler.showErrorModal(error);

    return EMPTY;
  }

  private renewSecretForUser(kind: PendingKind): Observable<void> {
    this.isFormLoading.set(true);

    this.currentSessionIs2fa.set(false);
    this.verificationForm.reset();

    return this.authService.user$.pipe(
      take(1),
      filter((user) => !!user),
      tap((user) => this.username.set(user.pw_name)),
      switchMap((user) => this.api.call('user.renew_2fa_secret', [user.pw_name, { interval: 30, otp_digits: 6 }])),
      switchMap(() => this.authService.refreshUser()),
      tap(() => {
        this.userTwoFactorAuthConfigured.set(true);
        this.setPendingVerification(true, kind);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private getConfirmation(): Observable<boolean> {
    if (this.userTwoFactorAuthConfigured()) {
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
    this.isFormLoading.set(true);

    return this.authService.user$.pipe(
      take(1),
      filter((user) => !!user),
      switchMap((user) => this.api.call('user.unset_2fa_secret', [user.pw_name])),
      switchMap(() => this.authService.refreshUser()),
      tap(() => {
        this.isFormLoading.set(false);
        this.userTwoFactorAuthConfigured.set(false);
        this.currentSessionIs2fa.set(false);
        this.setPendingVerification(false);
        this.verificationForm.reset();
      }),
    );
  }

  private setPendingVerification(isPending: boolean, kind: PendingKind = 'setup'): void {
    this.pendingVerification.set(isPending);
    this.pendingKind.set(kind);

    if (isPending) {
      this.window.localStorage.setItem(this.pendingVerificationKey(), kind);
    } else {
      this.window.localStorage.removeItem(this.pendingVerificationKey());
    }
  }

  private pendingVerificationKey(): string {
    return `${pendingVerificationKeyPrefix}:${this.username()}`;
  }
}
