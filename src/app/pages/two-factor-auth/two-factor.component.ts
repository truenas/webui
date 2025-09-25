import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, input, output, signal, inject, computed } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  Observable, of, EMPTY,
  combineLatest,
} from 'rxjs';
import {
  catchError,
  filter, switchMap, take, tap,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { AuthService } from 'app/modules/auth/auth.service';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';
import { twoFactorElements } from 'app/pages/two-factor-auth/two-factor.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-two-factor',
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    MatProgressBar,
    MatCardActions,
    NgxSkeletonLoaderModule,
    WarningComponent,
    MatButton,
    TestDirective,
    QrViewerComponent,
    TranslateModule,
    AsyncPipe,
    CopyButtonComponent,
  ],
})
export class TwoFactorComponent implements OnInit, OnDestroy {
  readonly isSetupDialog = input(false);
  readonly skipSetup = output();

  authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  protected matDialog = inject(MatDialog);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private window = inject<Window>(WINDOW);

  protected readonly searchableElements = twoFactorElements;

  userTwoFactorAuthConfigured = signal(false);
  protected isDataLoading = signal(false);
  protected isFormLoading = signal(false);
  globalTwoFactorEnabled = signal(false);
  showQrCodeWarning = false;

  protected readonly showSkipButton = computed(() => {
    return this.isSetupDialog() && !this.userTwoFactorAuthConfigured();
  });

  protected get global2FaMsg(): string {
    if (!this.globalTwoFactorEnabled()) {
      return this.translate.instant(helptext2fa.globallyDisabled);
    }
    if (this.userTwoFactorAuthConfigured()) {
      return this.translate.instant(helptext2fa.allSetUp);
    }
    return this.translate.instant(helptext2fa.enabledGloballyButNotForUser);
  }

  readonly helptext = helptext2fa;

  readonly labels = {
    secret: helptext2fa.secret.label,
    uri: helptext2fa.uri.label,
  };

  readonly tooltips = {
    secret: helptext2fa.secret.tooltip,
    uri: helptext2fa.uri.tooltip,
  };

  ngOnInit(): void {
    this.loadTwoFactorConfigs();

    this.showQrCodeWarning = this.window.localStorage.getItem('showQr2FaWarning') === 'true';
  }

  ngOnDestroy(): void {
    this.setQrWarningState(false);
  }

  private loadTwoFactorConfigs(): void {
    this.isDataLoading.set(true);
    combineLatest([
      this.authService.userTwoFactorConfig$.pipe(take(1)),
      this.authService.getGlobalTwoFactorConfig(),
    ])
      .pipe(take(1), untilDestroyed(this))
      .subscribe({
        next: ([userConfig, globalConfig]) => {
          this.isDataLoading.set(false);
          this.userTwoFactorAuthConfigured.set(userConfig.secret_configured);
          this.globalTwoFactorEnabled.set(globalConfig.enabled);
        },
      });
  }

  protected renewSecretOrEnable2Fa(): void {
    this.getConfirmation().pipe(
      filter(Boolean),
      switchMap(() => this.renewSecretForUser()),
      tap(() => this.isFormLoading.set(false)),
      catchError((error: unknown) => this.handleError(error)),
      untilDestroyed(this),
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

    this.setQrWarningState(true);

    return this.authService.user$.pipe(
      take(1),
      filter((user) => !!user),
      switchMap((user) => this.api.call('user.renew_2fa_secret', [user.pw_name, { interval: 30, otp_digits: 6 }])),
      switchMap(() => this.authService.refreshUser()),
      tap(() => {
        this.userTwoFactorAuthConfigured.set(true);
      }),
      untilDestroyed(this),
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
      untilDestroyed(this),
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
      switchMap(() => {
        this.isFormLoading.set(true);
        return this.authService.user$.pipe(
          take(1),
          filter((user) => !!user),
          switchMap((user) => this.api.call('user.unset_2fa_secret', [user.pw_name])),
        );
      }),
      switchMap(() => this.authService.refreshUser()),
      tap(() => {
        this.isFormLoading.set(false);
        this.userTwoFactorAuthConfigured.set(false);
        this.setQrWarningState(false);
      }),
      catchError((error: unknown) => this.handleError(error)),
      untilDestroyed(this),
    ).subscribe();
  }

  private setQrWarningState(show: boolean): void {
    this.showQrCodeWarning = show;
    this.window.localStorage.setItem('showQr2FaWarning', show.toString());
  }
}
