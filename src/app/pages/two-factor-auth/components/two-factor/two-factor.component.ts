import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import {
  delay,
  filter, shareReplay, tap,
} from 'rxjs/operators';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
import { helptext } from 'app/helptext/system/2fa';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
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
  isFormLoading = false;
  globalTwoFactorEnabled: boolean;
  private currentUser: LoggedInUser;
  intervalHint: string;

  readonly twoFactorConfig$: Observable<LoadingState<TwoFactorConfig>> = this.ws.call('auth.twofactor.config').pipe(
    tap((twoFactorConfig) => {
      this.globalTwoFactorEnabled = twoFactorConfig.enabled;
      this.cdr.markForCheck();
    }),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

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
    confirmation$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = true;
      this.cdr.markForCheck();
      this.ws.call('user.renew_2fa_secret', [this.currentUser.username]).pipe(delay(2000), untilDestroyed(this)).subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error({
            title: helptext.two_factor.error,
            message: error.reason,
            backtrace: error.trace.formatted,
          });
        },
      });
    });
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
