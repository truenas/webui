import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import {
  catchError,
  filter, switchMap, tap,
} from 'rxjs/operators';
import { helptext } from 'app/helptext/system/2fa';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { QrDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-dialog/qr-dialog.component';
import { RenewTwoFactorDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/renew-two-factor-dialog/renew-two-factor-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';

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
  intervalHint: string;

  get global2FaMsg(): string {
    if (!this.globalTwoFactorEnabled) {
      return this.translateService.instant(helptext.two_factor.global_disabled);
    }
    if (this.userTwoFactorAuthConfigured) {
      return this.translateService.instant(helptext.two_factor.global_enabled_user_enabled);
    }
    return this.translateService.instant(helptext.two_factor.global_enabled_user_disabled);
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
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private translateService: TranslateService,
    protected matDialog: MatDialog,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadTwoFactorConfigs();
  }

  loadTwoFactorConfigs(): void {
    this.isDataLoading = true;
    this.cdr.markForCheck();
    combineLatest([
      this.authService.getUserTwoFactorConfig(),
      this.authService.getGlobalTwoFactorConfig(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: ([userConfig, globalConfig]) => {
        this.isDataLoading = false;
        this.userTwoFactorAuthConfigured = userConfig.secret_configured;
        this.globalTwoFactorEnabled = globalConfig.enabled;
        this.cdr.markForCheck();
      },
    });
  }

  openQrDialog(provisioningUri: string): void {
    const dialogRef = this.matDialog.open(QrDialogComponent, {
      width: '300px',
      data: { qrInfo: provisioningUri },
    });
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.userTwoFactorAuthConfigured = true;
        this.cdr.markForCheck();
      },
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
        const dialogRef = this.matDialog.open(RenewTwoFactorDialogComponent);
        this.cdr.markForCheck();
        return dialogRef.afterClosed();
      }),
      tap((success) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        if (success) {
          this.showQrCode();
        }
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
    this.authService.getUserTwoFactorConfig().pipe(untilDestroyed(this)).subscribe({
      next: (config: UserTwoFactorConfig) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.openQrDialog(config.provisioning_uri);
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
