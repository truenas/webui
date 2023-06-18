import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  catchError,
  filter, shareReplay, switchMap, tap,
} from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { helptext } from 'app/helptext/system/2fa';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { QrDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-dialog/qr-dialog.component';
import { WebSocketService, DialogService } from 'app/services';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorComponent implements OnInit {
  userTwoFactorAuthConfigured = false;
  isDataLoading = false;
  isFormLoading = false;
  globalTwoFactorEnabled: boolean;
  private currentUser: LoggedInUser;
  intervalHint: string;

  get global2FaMsg(): string {
    if (!this.globalTwoFactorEnabled) {
      return this.translateService.instant('Two-Factor authentication is not enabled on this this system. You can configure your personal settings, but they will have no effect until two-factor authentication is enabled globally by system administrator');
    }
    if (this.userTwoFactorAuthConfigured) {
      return this.translateService.instant('Two-Factor authentication has been configured. No further actions are required.');
    }
    return this.translateService.instant('Two-Factor authentication is required on this system, but it\'s not yet configured for your user. Please configure it now.');
  }

  readonly helptext = helptext;

  readonly labels = {
    secret: helptext.two_factor.secret.placeholder,
    uri: helptext.two_factor.uri.placeholder,
  };

  readonly tooltips = {
    secret: helptext.two_factor.secret.tooltip,
    uri: helptext.two_factor.uri.tooltip,
  };

  get getRenewBtnText(): string {
    return this.userTwoFactorAuthConfigured
      ? this.translateService.instant('Renew 2FA secret')
      : this.translateService.instant('Configure 2FA secret');
  }

  constructor(
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private translateService: TranslateService,
    protected mdDialog: MatDialog,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((user) => {
      this.currentUser = user;
      this.userTwoFactorAuthConfigured = user.twofactor_auth_configured;
      this.cdr.markForCheck();
    });
    this.isDataLoading = true;
    this.cdr.markForCheck();
    this.ws.call('auth.twofactor.config').pipe(
      tap((twoFactorConfig) => {
        this.isDataLoading = false;
        this.globalTwoFactorEnabled = twoFactorConfig.enabled;
        this.cdr.markForCheck();
      }),
      toLoadingState(),
      shareReplay({
        refCount: false,
        bufferSize: 1,
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  openQrDialog(provisioningUri: string): void {
    this.mdDialog.open(QrDialogComponent, {
      width: '300px',
      data: { qrInfo: provisioningUri },
    });
  }

  renewSecret(): void {
    const confirmation$ = this.userTwoFactorAuthConfigured ? this.dialogService.confirm({
      title: helptext.two_factor.renewSecret.title,
      message: helptext.two_factor.renewSecret.message,
      hideCheckbox: true,
      buttonText: helptext.two_factor.renewSecret.btn,
    }) : of(true);
    confirmation$.pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading = true;
        this.cdr.markForCheck();
        return this.authService.renewUser2FaSecret();
      }),
      tap(() => {
        this.isFormLoading = false;
        this.userTwoFactorAuthConfigured = true;
        this.cdr.markForCheck();
        this.showQrCode();
      }),
      catchError((error: WebsocketError) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        return this.dialogService.error({
          title: helptext.two_factor.error,
          message: error.reason,
          backtrace: error.trace.formatted,
        } as ErrorReport);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  showQrCode(): void {
    this.isFormLoading = true;
    this.ws.call('user.provisioning_uri', [this.currentUser.username]).pipe(untilDestroyed(this)).subscribe({
      next: (provisioningUri: string) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.openQrDialog(provisioningUri);
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.dialogService.error({
          title: helptext.two_factor.error,
          message: error.reason,
          backtrace: error.trace.formatted,
        });
      },
    });
  }
}
