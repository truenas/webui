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
  filter, shareReplay, switchMap, take, tap,
} from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptext } from 'app/helptext/system/2fa';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { QrDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-dialog/qr-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

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
      take(1),
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
    const dialogRef = this.mdDialog.open(QrDialogComponent, {
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
        this.cdr.markForCheck();
        return this.authService.renewUser2FaSecret();
      }),
      tap(() => {
        this.isFormLoading = false;
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
