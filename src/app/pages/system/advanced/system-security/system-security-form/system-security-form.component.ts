import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatHint } from '@angular/material/form-field';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map, of } from 'rxjs';
import { stigPasswordRequirements } from 'app/constants/stig-password-requirements.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PasswordComplexityRuleset, passwordComplexityRulesetLabels } from 'app/enums/password-complexity-ruleset.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
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
    MatHint,
    IxInputComponent,
    IxSelectComponent,
  ],
})
export class SystemSecurityFormComponent implements OnInit {
  protected readonly stigRequirements = stigPasswordRequirements;
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  form = this.formBuilder.group({
    enable_fips: [false],
    enable_gpos_stig: [false],
    min_password_age: [
      null as number | null,
      [Validators.min(1), Validators.max(365), this.stigValidator.bind(this)],
    ],
    max_password_age: [
      null as number | null,
      [Validators.min(7), Validators.max(365), this.stigValidator.bind(this)],
    ],
    password_complexity_ruleset: [
      null as PasswordComplexityRuleset[] | null,
      [this.stigValidator.bind(this)],
    ],
    min_password_length: [
      null as number | null,
      [Validators.min(8), Validators.max(128), this.stigValidator.bind(this)],
    ],
    password_history_length: [
      null as number | null,
      [Validators.min(1), Validators.max(10), this.stigValidator.bind(this)],
    ],
  });

  complexityRulesetLabels$ = of(passwordComplexityRulesetLabels).pipe(
    map((rulesets) => mapToOptions(rulesets, this.translate)),
  );

  private systemSecurityConfig = signal<SystemSecurityConfig>(this.slideInRef.getData());
  protected isStigEnabled = signal<boolean>(false);

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private api: ApiService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    public slideInRef: SlideInRef<SystemSecurityConfig, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    if (this.systemSecurityConfig()) {
      this.initSystemSecurityForm();
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
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.isStigEnabled.set(value);

        if (value) {
          // Pre-populate STIG requirements when STIG is enabled
          this.form.patchValue({
            enable_fips: true,
            min_password_age: stigPasswordRequirements.minPasswordAge,
            max_password_age: stigPasswordRequirements.maxPasswordAge,
            password_complexity_ruleset: [...stigPasswordRequirements.passwordComplexity],
            min_password_length: stigPasswordRequirements.minPasswordLength,
            password_history_length: stigPasswordRequirements.passwordHistoryLength,
          });
        }

        // Trigger validation update
        Object.keys(this.form.controls).forEach((key) => {
          if (key !== 'enable_gpos_stig' && key !== 'enable_fips') {
            const control = this.form.controls[key as keyof typeof this.form.controls];
            control.updateValueAndValidity();
          }
        });
      });
  }
}
