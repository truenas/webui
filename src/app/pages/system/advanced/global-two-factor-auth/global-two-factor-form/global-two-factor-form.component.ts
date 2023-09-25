import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  EMPTY, catchError, filter, of, switchMap, tap,
} from 'rxjs';
import { TwoFactorConfig, TwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TwoFactorGuardService } from 'app/services/auth/two-factor-guard.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './global-two-factor-form.component.html',
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

  readonly otpDigitOptions$ = of([
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
  ]);

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
    private twoFactorAuthGuardService: TwoFactorGuardService,
    @Inject(SLIDE_IN_DATA) protected twoFactorConfig: TwoFactorConfig,
    private router: Router,
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
    let shouldWarn = true;
    if (!this.twoFactorConfig.enabled || !this.form.value.enabled) {
      shouldWarn = false;
    }

    const values = this.form.value;
    const payload: TwoFactorConfigUpdate = {
      enabled: values.enabled,
      otp_digits: values.otp_digits,
      services: { ssh: values.ssh },
      interval: values.interval,
      window: values.window,
    };
    const confirmation$ = shouldWarn ? this.dialogService.confirm({
      title: this.translate.instant('Warning!'),
      message: this.translate.instant('Changing global 2FA settings might cause user secrets to reset. Which means users will have to reconfigure their 2FA. Are you sure you want to continue?'),
    }) : of(true);
    confirmation$.pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading = true;
        return this.ws.call('auth.twofactor.update', [payload]);
      }),
      tap(() => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.twoFactorAuthGuardService.updateGlobalConfig();
        if (!_.isEqual(this.twoFactorConfig, payload) && payload.enabled) {
          this.router.navigate(['/two-factor-auth']);
        }
        this.cdr.markForCheck();
        this.slideInRef.close(true);
      }),
      catchError((error) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
        return EMPTY;
      }),
    ).pipe(untilDestroyed(this)).subscribe();
  }
}
