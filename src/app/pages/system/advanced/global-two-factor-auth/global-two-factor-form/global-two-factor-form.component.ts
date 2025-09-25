import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  EMPTY, catchError, filter, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalTwoFactorConfig, GlobalTwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-two-factor-auth-form',
  templateUrl: './global-two-factor-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class GlobalTwoFactorAuthFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  slideInRef = inject<SlideInRef<GlobalTwoFactorConfig, boolean>>(SlideInRef);
  private window = inject<Window>(WINDOW);

  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  protected isFormLoading = signal(false);
  form = this.fb.nonNullable.group({
    enabled: [false],
    window: [null as number | null, Validators.required],
    ssh: [false],
  });

  enableWarning: string = this.translate.instant('Once enabled, users will be prompted to set up two-factor authentication next time they login. They can choose to skip the setup if desired.');

  protected twoFactorConfig: GlobalTwoFactorConfig;

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.twoFactorConfig = this.slideInRef.getData();
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
  }

  onSubmit(): void {
    let shouldWarn = true;
    if (!this.twoFactorConfig.enabled || !this.form.value.enabled) {
      shouldWarn = false;
    }

    const values = this.form.getRawValue();
    const payload: GlobalTwoFactorConfigUpdate = {
      enabled: values.enabled,
      services: { ssh: values.ssh },
      window: Number(values.window),
    };
    const confirmation$ = shouldWarn
      ? this.dialogService.confirm({
        title: this.translate.instant('Warning!'),
        message: this.translate.instant('Changing global 2FA settings might cause user secrets to reset. Which means users will have to reconfigure their 2FA. Are you sure you want to continue?'),
      })
      : of(true);
    confirmation$.pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading.set(true);
        return this.api.call('auth.twofactor.update', [payload]);
      }),
      tap(() => {
        this.window.localStorage.setItem('showQr2FaWarning', `${this.form.value.enabled}`);
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.authService.globalTwoFactorConfigUpdated();
        if (!isEqual(this.twoFactorConfig, payload) && payload.enabled) {
          this.router.navigate(['/two-factor-auth']);
        }
        this.slideInRef.close({ response: true });
      }),
      catchError((error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
    ).pipe(untilDestroyed(this)).subscribe();
  }
}
