import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import {
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
  twoFactorAuthConfigured = false;
  isFormLoading = false;
  twoFactorEnabled: boolean;
  private currentUser: LoggedInUser;
  intervalHint: string;

  readonly twoFactorConfig$: Observable<LoadingState<TwoFactorConfig>> = this.ws.call('auth.twofactor.config').pipe(
    tap((twoFactorConfig) => {
      this.twoFactorEnabled = twoFactorConfig.enabled;
      this.cdr.markForCheck();
    }),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

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
    return this.twoFactorAuthConfigured
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
      this.twoFactorAuthConfigured = user.twofactor_auth_configured;
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
    const confirmation$ = this.twoFactorAuthConfigured ? this.dialogService.confirm({
      title: helptext.two_factor.renewSecret.title,
      message: helptext.two_factor.renewSecret.message,
      hideCheckbox: true,
      buttonText: helptext.two_factor.renewSecret.btn,
    }) : of(true);
    confirmation$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = true;
      this.ws.call('user.renew_2fa_secret', [this.currentUser.username]).pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isFormLoading = false;
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
