import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TwoFactorConfig, TwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  templateUrl: './global-two-factor-auth-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalTwoFactorAuthFormComponent implements OnInit {
  isFormLoading = false;
  form = this.fb.group({
    enabled: [false],
    interval: [null as number, Validators.required],
    otp_digits: [null as number, Validators.required],
    window: [null as number, Validators.required],
    ssh: [false],
  });

  enableWarning: string = this.translate.instant('Once enabled, users will be required to set up two factor authentication next time they login.');

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private slideInRef: IxSlideInRef<GlobalTwoFactorAuthFormComponent>,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    @Inject(SLIDE_IN_DATA) protected twoFactorConfig: TwoFactorConfig,
  ) {}

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.form.patchValue({
      enabled: this.twoFactorConfig.enabled,
      otp_digits: this.twoFactorConfig.otp_digits,
      window: this.twoFactorConfig.window,
      interval: this.twoFactorConfig.interval,
      ssh: this.twoFactorConfig.services.ssh,
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const values = this.form.value;
    const payload: TwoFactorConfigUpdate = {
      enabled: values.enabled,
      otp_digits: values.otp_digits,
      services: { ssh: values.ssh },
      interval: values.interval,
      window: values.window,
    };
    this.isFormLoading = true;
    this.ws.call('auth.twofactor.update', [payload]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.cdr.markForCheck();
        this.slideInRef.close(true);
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }
}
