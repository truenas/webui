import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatError, MatHint } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, of, switchMap,
} from 'rxjs';
import { stigPasswordRequirements } from 'app/constants/stig-password-requirements.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PasswordComplexityRuleset, passwordComplexityRulesetLabels } from 'app/enums/password-complexity-ruleset.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-form',
  templateUrl: './system-security-form.component.html',
  styleUrls: ['./system-security-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxSlideToggleComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    MatError,
    MatHint,
    IxInputComponent,
    IxSelectComponent,
  ],
})
export class SystemSecurityFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  slideInRef = inject<SlideInRef<SystemSecurityConfig, boolean>>(SlideInRef);

  protected readonly stigRequirements = stigPasswordRequirements;
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  private readonly stigValidatorFn = this.stigValidator.bind(this);

  form = this.formBuilder.group({
    enable_fips: [false],
    enable_gpos_stig: [false],
    min_password_age: [
      null as number | null,
      [Validators.min(1), Validators.max(365), this.stigValidatorFn],
    ],
    max_password_age: [
      null as number | null,
      [Validators.min(7), Validators.max(365), this.stigValidatorFn],
    ],
    password_complexity_ruleset: [
      null as PasswordComplexityRuleset[] | null,
      [this.stigValidatorFn],
    ],
    min_password_length: [
      null as number | null,
      [Validators.min(8), Validators.max(128), Validators.required, this.stigValidatorFn],
    ],
    password_history_length: [
      null as number | null,
      [Validators.min(1), Validators.max(10), Validators.required, this.stigValidatorFn],
    ],
  });

  complexityRulesetLabels$ = of(passwordComplexityRulesetLabels).pipe(
    map((rulesets) => mapToOptions(rulesets, this.translate)),
  );

  private systemSecurityConfig = signal<SystemSecurityConfig>(this.slideInRef.getData());
  protected isStigEnabled = signal<boolean>(false);
  protected globalTwoFactorEnabled = signal<boolean>(false);
  protected stigValidationError = signal<string | null>(null);

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    if (this.systemSecurityConfig()) {
      this.initSystemSecurityForm();
      // Check global 2FA status if STIG is already enabled
      if (this.systemSecurityConfig().enable_gpos_stig) {
        this.api.call('auth.twofactor.config').pipe(
          untilDestroyed(this),
        ).subscribe((twoFactorConfig) => {
          const enabled = twoFactorConfig?.enabled || false;
          this.globalTwoFactorEnabled.set(enabled);
          if (!enabled) {
            this.stigValidationError.set('Global Two-Factor Authentication must be enabled to activate this feature.');
            this.form.controls.enable_gpos_stig.setErrors({ globalTwoFactorRequired: true });
          }
        });
      }
    }
  }

  private stigValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.isStigEnabled?.()) {
      return null;
    }

    const controlName = Object.keys(this.form?.controls || {}).find(
      (key) => this.form?.controls[key as keyof typeof this.form.controls] === control,
    );

    if (!controlName) {
      return null;
    }

    const value = control.value as unknown;

    switch (controlName) {
      case 'min_password_age':
        if (value !== null && (value as number) < stigPasswordRequirements.minPasswordAge) {
          return {
            stigMinPasswordAge: {
              required: stigPasswordRequirements.minPasswordAge,
              actual: value as number,
            },
          };
        }
        break;
      case 'max_password_age':
        if (value !== null && (value as number) > stigPasswordRequirements.maxPasswordAge) {
          return {
            stigMaxPasswordAge: {
              required: stigPasswordRequirements.maxPasswordAge,
              actual: value as number,
            },
          };
        }
        break;
      case 'min_password_length':
        if (value !== null && (value as number) < stigPasswordRequirements.minPasswordLength) {
          return {
            stigMinPasswordLength: {
              required: stigPasswordRequirements.minPasswordLength,
              actual: value as number,
            },
          };
        }
        break;
      case 'password_history_length':
        if (value !== null && (value as number) < stigPasswordRequirements.passwordHistoryLength) {
          return {
            stigPasswordHistoryLength: {
              required: stigPasswordRequirements.passwordHistoryLength,
              actual: value as number,
            },
          };
        }
        break;
      case 'password_complexity_ruleset':
        if (value && Array.isArray(value)) {
          const requiredComplexity = [...stigPasswordRequirements.passwordComplexity];
          const hasAllRequired = requiredComplexity.every((req) => (value as unknown[]).includes(req));
          if (!hasAllRequired) {
            return { stigPasswordComplexity: { required: requiredComplexity, actual: value } };
          }
        }
        break;
    }

    return null;
  }

  protected onSubmit(): void {
    const values = this.form.value as unknown as SystemSecurityConfig;
    const isEnablingStig = values.enable_gpos_stig && !this.systemSecurityConfig().enable_gpos_stig;

    if (isEnablingStig) {
      this.checkUsersWithoutTwoFactorAuth(() => this.saveSettings(values));
    } else {
      this.saveSettings(values);
    }
  }

  private checkUsersWithoutTwoFactorAuth(callback: () => void): void {
    this.api.call('user.query', [[
      ['builtin', '=', false],
      ['twofactor_auth_configured', '=', false],
      ['locked', '=', false],
      ['password_disabled', '=', false],
      ['roles', '!=', []],
    ]] as QueryParams<User>).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (users) => {
        if (users.length > 0) {
          this.showStigWarningDialog(users, callback);
        } else {
          callback();
        }
      },
      error: (error: unknown) => {
        this.errorHandler.withErrorHandler()(of(error));
      },
    });
  }

  private showStigWarningDialog(usersWithoutTwoFactor: User[], callback: () => void): void {
    const userList = usersWithoutTwoFactor.map((user) => user.username).join(', ');
    const message = this.translate.instant(
      'Warning: The following users have roles but do not have Two-Factor Authentication configured: {userList}. '
      + 'These users will not be able to log in once STIG mode is enabled. '
      + 'Please configure Two-Factor Authentication for these users before enabling STIG mode if you want them to retain access.',
      { userList },
    );

    this.dialogService.confirm({
      title: this.translate.instant('STIG Mode Warning'),
      message,
      buttonText: this.translate.instant('Enable STIG Mode Anyway'),
      cancelText: this.translate.instant('Cancel'),
      hideCheckbox: true,
    }).pipe(
      filter((result) => !!result),
      untilDestroyed(this),
    ).subscribe(() => {
      callback();
    });
  }

  private saveSettings(values: SystemSecurityConfig): void {
    if (values.password_complexity_ruleset) {
      values.password_complexity_ruleset = {
        $set: values.password_complexity_ruleset as unknown as PasswordComplexityRuleset[],
      };
    }

    this.dialogService.jobDialog(
      this.api.job('system.security.update', [values]),
      {
        title: this.translate.instant('Saving settings'),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        if (values.enable_gpos_stig) {
          this.authService.clearAuthToken();
        }

        this.slideInRef.close({ response: true });
        this.snackbar.success(this.translate.instant('System Security Settings Updated.'));
      });
  }

  private initSystemSecurityForm(): void {
    const config = this.systemSecurityConfig();
    this.isStigEnabled.set(config.enable_gpos_stig);

    this.form.patchValue({
      ...config,
      password_complexity_ruleset: config.password_complexity_ruleset?.$set,
    });

    this.form.controls.enable_gpos_stig.valueChanges
      .pipe(
        switchMap((value) => {
          this.isStigEnabled.set(value);
          if (value) {
            // Check if global 2FA is enabled
            return this.api.call('auth.twofactor.config').pipe(
              map((twoFactorConfig) => ({ stigEnabled: value, twoFactorEnabled: twoFactorConfig?.enabled || false })),
            );
          }
          return of({ stigEnabled: value, twoFactorEnabled: false });
        }),
        untilDestroyed(this),
      )
      .subscribe(({ stigEnabled, twoFactorEnabled }) => {
        if (stigEnabled) {
          this.globalTwoFactorEnabled.set(twoFactorEnabled);
          if (!twoFactorEnabled) {
            this.stigValidationError.set('Global Two-Factor Authentication must be enabled to activate this feature.');
            this.form.controls.enable_gpos_stig.setErrors({ globalTwoFactorRequired: true });
          } else {
            this.stigValidationError.set(null);
            // Remove only the globalTwoFactorRequired error
            const errors = this.form.controls.enable_gpos_stig.errors;
            if (errors?.['globalTwoFactorRequired']) {
              delete errors['globalTwoFactorRequired'];
              const hasErrors = Object.keys(errors).length > 0;
              this.form.controls.enable_gpos_stig.setErrors(hasErrors ? errors : null);
            }
          }
          const currentValues = this.form.value;
          const updates: Partial<typeof currentValues> = {
            enable_fips: true,
          };

          if (
            !currentValues.min_password_age
            || currentValues.min_password_age < stigPasswordRequirements.minPasswordAge
          ) {
            updates.min_password_age = stigPasswordRequirements.minPasswordAge;
          }

          if (
            !currentValues.max_password_age
            || currentValues.max_password_age > stigPasswordRequirements.maxPasswordAge
          ) {
            updates.max_password_age = stigPasswordRequirements.maxPasswordAge;
          }

          if (
            !currentValues.min_password_length
            || currentValues.min_password_length < stigPasswordRequirements.minPasswordLength
          ) {
            updates.min_password_length = stigPasswordRequirements.minPasswordLength;
          }

          if (
            !currentValues.password_history_length
            || currentValues.password_history_length < stigPasswordRequirements.passwordHistoryLength
          ) {
            updates.password_history_length = stigPasswordRequirements.passwordHistoryLength;
          }

          const currentComplexity = currentValues.password_complexity_ruleset || [];
          const requiredComplexity = [...stigPasswordRequirements.passwordComplexity];
          const hasAllRequired = requiredComplexity.every((req) => currentComplexity.includes(req));
          if (!hasAllRequired) {
            const mergedComplexity = [...new Set([...currentComplexity, ...requiredComplexity])];
            updates.password_complexity_ruleset = mergedComplexity;
          }

          this.form.patchValue(updates);
        } else {
          // Reset validation error when STIG is disabled
          this.stigValidationError.set(null);
          this.globalTwoFactorEnabled.set(false);
          const errors = this.form.controls.enable_gpos_stig.errors;
          if (errors?.['globalTwoFactorRequired']) {
            delete errors['globalTwoFactorRequired'];
            const hasErrors = Object.keys(errors).length > 0;
            this.form.controls.enable_gpos_stig.setErrors(hasErrors ? errors : null);
          }
        }

        Object.keys(this.form.controls).forEach((key) => {
          if (key !== 'enable_gpos_stig' && key !== 'enable_fips') {
            const control = this.form.controls[key as keyof typeof this.form.controls];
            control.updateValueAndValidity();
          }
        });
      });
  }

  navigateToGlobal2Fa(): void {
    // Mark form as pristine to avoid unsaved changes dialog
    this.form.markAsPristine();
    this.slideInRef.close({ response: false });
    this.router.navigate(['/credentials/two-factor']);
  }
}
