import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, Inject, OnDestroy, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, forkJoin, of } from 'rxjs';
import {
  catchError,
  filter, switchMap, take, tap,
} from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorComponent implements OnInit, OnDestroy {
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
    private ws: WebSocketService,
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
      catchError((error: WebSocketError) => this.handleError(error)),
      untilDestroyed(this),
    ).subscribe();
  }

  private handleError(error: WebSocketError): Observable<boolean> {
    this.toggleLoading(false);

    return this.dialogService.error({
      title: helptext2fa.two_factor.error,
      message: error.reason,
      backtrace: error.trace?.formatted,
    } as ErrorReport);
  }

  private renewSecretForUser(): Observable<void> {
    this.toggleLoading(true);

    this.window.localStorage.setItem('showQr2FaWarning', 'true');

    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => this.ws.call('user.renew_2fa_secret', [user.pw_name, { interval: 30, otp_digits: 6 }])),
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
