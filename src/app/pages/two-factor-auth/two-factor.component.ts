import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, Inject, OnDestroy, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  Observable, forkJoin, of, EMPTY,
} from 'rxjs';
import {
  catchError,
  filter, switchMap, take, tap,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';
import { twoFactorElements } from 'app/pages/two-factor-auth/two-factor.elements';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-two-factor',
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  protected readonly searchableElements = twoFactorElements;

  userTwoFactorAuthConfigured = false;
  isDataLoading = false;
  isFormLoading = false;
  globalTwoFactorEnabled: boolean;
  showQrCodeWarning = false;

  get global2FaMsg(): string {
    if (!this.globalTwoFactorEnabled) {
      return this.translate.instant(helptext2fa.two_factor.global_disabled);
    }
    if (this.userTwoFactorAuthConfigured) {
      return this.translate.instant(helptext2fa.two_factor.global_enabled_user_enabled);
    }
    return this.translate.instant(helptext2fa.two_factor.global_enabled_user_disabled);
  }

  readonly helptext = helptext2fa;

  readonly labels = {
    secret: helptext2fa.two_factor.secret.placeholder,
    uri: helptext2fa.two_factor.uri.placeholder,
  };

  readonly tooltips = {
    secret: helptext2fa.two_factor.secret.tooltip,
    uri: helptext2fa.two_factor.uri.tooltip,
  };

  constructor(
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private translate: TranslateService,
    protected matDialog: MatDialog,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.loadTwoFactorConfigs();

    this.showQrCodeWarning = this.window.localStorage.getItem('showQr2FaWarning') === 'true';
  }

  ngOnDestroy(): void {
    this.window.localStorage.setItem('showQr2FaWarning', 'false');
  }

  loadTwoFactorConfigs(): void {
    this.isDataLoading = true;
    this.cdr.markForCheck();
    forkJoin([
      this.authService.userTwoFactorConfig$.pipe(take(1)),
      this.authService.getGlobalTwoFactorConfig(),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([userConfig, globalConfig]) => {
          this.isDataLoading = false;
          this.userTwoFactorAuthConfigured = userConfig.secret_configured;
          this.globalTwoFactorEnabled = globalConfig.enabled;
          this.cdr.markForCheck();
        },
      });
  }

  renewSecretOrEnable2Fa(): void {
    this.getConfirmation().pipe(
      filter(Boolean),
      switchMap(() => this.renewSecretForUser()),
      tap(() => this.toggleLoading(false)),
      catchError((error: unknown) => this.handleError(error)),
      untilDestroyed(this),
    ).subscribe();
  }

  getProvisioningUriSecret(uri: string): string {
    const url = new URL(uri);
    const params = new URLSearchParams(url.search);

    return params.get('secret');
  }

  private handleError(error: unknown): Observable<boolean> {
    this.toggleLoading(false);
    this.errorHandler.showErrorModal(error);

    return EMPTY;
  }

  private renewSecretForUser(): Observable<void> {
    this.toggleLoading(true);

    this.window.localStorage.setItem('showQr2FaWarning', 'true');

    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => this.api.call('user.renew_2fa_secret', [user.pw_name, { interval: 30, otp_digits: 6 }])),
      switchMap(() => this.authService.refreshUser()),
      tap(() => {
        this.userTwoFactorAuthConfigured = true;
        this.showQrCodeWarning = true;
      }),
      untilDestroyed(this),
    );
  }

  private getConfirmation(): Observable<boolean> {
    if (this.userTwoFactorAuthConfigured) {
      return this.dialogService.confirm({
        title: helptext2fa.two_factor.renewSecret.title,
        message: helptext2fa.two_factor.renewSecret.message,
        hideCheckbox: true,
        buttonText: helptext2fa.two_factor.renewSecret.btn,
      });
    }
    return of(true);
  }

  private toggleLoading(isLoading: boolean): void {
    this.isFormLoading = isLoading;
    this.cdr.markForCheck();
  }
}
