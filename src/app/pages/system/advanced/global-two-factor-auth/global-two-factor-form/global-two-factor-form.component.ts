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
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalTwoFactorConfig, GlobalTwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { elements } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.elements';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './global-two-factor-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalTwoFactorAuthFormComponent implements OnInit {
  protected requiredRoles = [Role.FullAdmin];
  protected searchElements = elements;

  isFormLoading = false;
  form = this.fb.group({
    enabled: [false],
    window: [null as number, Validators.required],
    ssh: [false],
  });

  enableWarning: string = this.translate.instant('Once enabled, users will be required to set up two factor authentication next time they login.');

  protected twoFactorConfig: GlobalTwoFactorConfig;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private authService: AuthService,
    private router: Router,
    private chainedRef: ChainedRef<GlobalTwoFactorConfig>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.twoFactorConfig = this.chainedRef.getData();
  }

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.form.patchValue({
      enabled: this.twoFactorConfig.enabled,
      window: this.twoFactorConfig.window,
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
    const payload: GlobalTwoFactorConfigUpdate = {
      enabled: values.enabled,
      services: { ssh: values.ssh },
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
        this.window.localStorage.setItem('showQr2FaWarning', `${this.form.value.enabled}`);
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.authService.globalTwoFactorConfigUpdated();
        if (!_.isEqual(this.twoFactorConfig, payload) && payload.enabled) {
          this.router.navigate(['/two-factor-auth']);
        }
        this.cdr.markForCheck();
        this.chainedRef.close({ response: true, error: null });
      }),
      catchError((error) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
        this.cdr.markForCheck();
        return EMPTY;
      }),
    ).pipe(untilDestroyed(this)).subscribe();
  }
}
