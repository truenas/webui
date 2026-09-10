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
 */
const pendingVerificationKey = 'pending2FaVerification';

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
  pendingVerification = signal(false);

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
      return this.translate.instant(helptext2fa.verification.pending);
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
      this.authService.userTwoFactorConfig$.pipe(take(1)),
      this.authService.getGlobalTwoFactorConfig(),
    ])
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([userConfig, globalConfig]) => {
          this.isDataLoading.set(false);
          this.userTwoFactorAuthConfigured.set(userConfig.secret_configured);
          this.globalTwoFactorEnabled.set(globalConfig.enabled);
          // A stored flag without a secret is stale — the secret was unset elsewhere.
          this.pendingVerification.set(
            userConfig.secret_configured && this.window.localStorage.getItem(pendingVerificationKey) === 'true',
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
    this.getConfirmation().pipe(
      filter(Boolean),
      switchMap(() => this.renewSecretForUser()),
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
    this.dialogService.confirm({
      title: this.translate.instant(helptext2fa.verification.cancel.title),
      message: this.translate.instant(helptext2fa.verification.cancel.message),
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

  private renewSecretForUser(): Observable<void> {
    this.isFormLoading.set(true);

    this.currentSessionIs2fa.set(false);
    this.verificationForm.reset();

    return this.authService.user$.pipe(
      take(1),
      filter((user) => !!user),
      switchMap((user) => this.api.call('user.renew_2fa_secret', [user.pw_name, { interval: 30, otp_digits: 6 }])),
      switchMap(() => this.authService.refreshUser()),
      tap(() => {
        this.userTwoFactorAuthConfigured.set(true);
        this.setPendingVerification(true);
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

  private setPendingVerification(isPending: boolean): void {
    this.pendingVerification.set(isPending);
    this.window.localStorage.setItem(pendingVerificationKey, isPending.toString());
  }
}
