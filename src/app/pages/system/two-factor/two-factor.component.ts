import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { helptext } from 'app/helptext/system/2fa';
import { TwoFactorConfig, TwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { QrDialogComponent } from 'app/pages/system/two-factor/qr-dialog/qr-dialog.component';
import { WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorComponent implements OnInit {
  isFormLoading = false;
  twoFactorEnabled: boolean;
  secret: string;
  intervalHint: string;

  private digitsOnLoad: number;
  private intervalOnLoad: number;

  form = this.fb.group({
    otp_digits: [null as number, [Validators.required, Validators.min(6), Validators.max(8)]],
    interval: [null as number, [Validators.min(5)]],
    window: [null as number, [Validators.min(0)]],
    ssh: [false],
    secret: [''],
    uri: [''],
  });

  readonly helptext = helptext;

  readonly labels = {
    otp_digits: helptext.two_factor.otp.placeholder,
    interval: helptext.two_factor.interval.placeholder,
    window: helptext.two_factor.window.placeholder,
    ssh: helptext.two_factor.services.placeholder,
    secret: helptext.two_factor.secret.placeholder,
    uri: helptext.two_factor.uri.placeholder,
  };

  readonly tooltips = {
    otp_digits: helptext.two_factor.otp.tooltip,
    interval: helptext.two_factor.interval.tooltip,
    window: helptext.two_factor.window.tooltip,
    ssh: helptext.two_factor.services.tooltip,
    secret: helptext.two_factor.secret.tooltip,
    uri: helptext.two_factor.uri.tooltip,
  };

  readonly otpDigitOptions$ = of([
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
  ]);

  constructor(
    private fb: FormBuilder,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private errorHandler: FormErrorHandlerService,
    protected mdDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('auth.twofactor.config').pipe(untilDestroyed(this)).subscribe({
      next: (config: TwoFactorConfig) => {
        this.secret = config.secret;
        this.twoFactorEnabled = config.enabled;
        this.digitsOnLoad = config.otp_digits;
        this.intervalOnLoad = config.interval;

        this.form.patchValue({
          ...config,
          ssh: config.services.ssh,
        });
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(this, error, this.dialogService);
        this.cdr.markForCheck();
      },
    });

    this.getUri(false);

    this.form.controls.interval.valueChanges.pipe(untilDestroyed(this)).subscribe((val: number | string) => {
      if (this.form.controls.interval.valid && Number(val) !== 30) {
        this.intervalHint = helptext.two_factor.interval.hint;
      } else {
        this.intervalHint = null;
      }
    });
  }

  onSubmit(): void {
    const values = this.form.value;
    const params = {
      otp_digits: values.otp_digits,
      interval: values.interval,
      window: values.window,
      enabled: this.twoFactorEnabled,
      services: { ssh: values.ssh },
    };

    if (params.otp_digits === this.digitsOnLoad && params.interval === this.intervalOnLoad) {
      this.doSubmit(params);
    } else {
      this.dialogService.confirm({
        title: helptext.two_factor.submitDialog.title,
        message: helptext.two_factor.submitDialog.message,
        hideCheckBox: true,
        buttonMsg: helptext.two_factor.submitDialog.btn,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.intervalOnLoad = params.interval;
        this.digitsOnLoad = params.otp_digits;
        this.doSubmit(params, true);
      });
    }
  }

  doSubmit(params: TwoFactorConfigUpdate, openQr = false): void {
    this.isFormLoading = true;

    this.ws.call('auth.twofactor.update', [params]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        if (openQr) {
          this.openQrDialog();
        }
      },
      error: (err) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(err, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  get twoFactorStatusText(): string {
    return this.twoFactorEnabled
      ? helptext.two_factor.enabled_status_true
      : helptext.two_factor.enabled_status_false;
  }

  get twoFactorButtonText(): string {
    return this.twoFactorEnabled
      ? helptext.two_factor.disable_button
      : helptext.two_factor.enable_button;
  }

  toggleTwoFactor(): void {
    if (this.twoFactorEnabled) {
      this.twoFactorEnabled = false;
      this.ws.call('auth.twofactor.update', [{ enabled: false }])
        .pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.isFormLoading = false;
          },
          error: (err) => {
            this.isFormLoading = false;
            this.twoFactorEnabled = true;
            this.dialogService.errorReport(helptext.two_factor.error,
              err.reason, err.trace.formatted);
          },
        });
    } else {
      this.dialogService.confirm({
        title: helptext.two_factor.confirm_dialog.title,
        message: helptext.two_factor.confirm_dialog.message,
        hideCheckBox: true,
        buttonMsg: helptext.two_factor.confirm_dialog.btn,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.isFormLoading = true;

        this.ws.call('auth.twofactor.update', [{ enabled: true }])
          .pipe(untilDestroyed(this)).subscribe({
            next: () => {
              this.isFormLoading = false;
              this.twoFactorEnabled = true;
              this.updateSecretAndUri();
            },
            error: (err) => {
              this.isFormLoading = false;
              this.dialogService.errorReport(helptext.two_factor.error,
                err.reason, err.trace.formatted);
            },
          });
      });
    }
  }

  openQrDialog(): void {
    this.mdDialog.open(QrDialogComponent, {
      width: '300px',
      data: { qrInfo: this.form.controls.uri.value },
    });
  }

  renewSecret(): void {
    this.dialogService.confirm({
      title: helptext.two_factor.renewSecret.title,
      message: helptext.two_factor.renewSecret.message,
      hideCheckBox: true,
      buttonMsg: helptext.two_factor.renewSecret.btn,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = true;

      this.ws.call('auth.twofactor.renew_secret').pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isFormLoading = false;
          this.updateSecretAndUri();
        },
        error: (err) => {
          this.isFormLoading = false;
          this.dialogService.errorReport(helptext.two_factor.error,
            err.reason, err.trace.formatted);
        },
      });
    });
  }

  updateSecretAndUri(): void {
    this.isFormLoading = true;
    this.ws.call('auth.twofactor.config').pipe(untilDestroyed(this)).subscribe({
      next: (config: TwoFactorConfig) => {
        this.isFormLoading = false;

        this.form.controls.secret.setValue(config.secret);
        this.cdr.markForCheck();
        this.secret = config.secret;
        this.getUri();
      },
      error: (err) => {
        this.isFormLoading = false;
        this.dialogService.errorReport(helptext.two_factor.error,
          err.reason, err.trace.formatted);
      },
    });
  }

  getUri(openQr = true): void {
    this.isFormLoading = true;
    this.ws.call('auth.twofactor.provisioning_uri').pipe(untilDestroyed(this)).subscribe({
      next: (provisioningUri: string) => {
        this.isFormLoading = false;

        this.form.controls.uri.setValue(provisioningUri);
        this.cdr.markForCheck();
        if (this.secret && openQr) {
          this.openQrDialog();
        }
      },
      error: (err) => {
        this.isFormLoading = false;
        this.dialogService.errorReport(helptext.two_factor.error,
          err.reason, err.trace.formatted);
      },
    });
  }
}
