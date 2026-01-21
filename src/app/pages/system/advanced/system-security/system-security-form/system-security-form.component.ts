import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, finalize, map, of, tap, zip, forkJoin,
} from 'rxjs';
import { stigPasswordRequirements } from 'app/constants/stig-password-requirements.constants';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { PasswordComplexityRuleset, passwordComplexityRulesetLabels } from 'app/enums/password-complexity-ruleset.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/** time to wait in milliseconds between opening a slidein and highlighting an element on it */
const slideInAnimationDuration = 600;

/**
 * helper type representing all requirements for enabling STIG mode
 * and their fulfillment status.
 */
interface StigEnablementRequirements {
  /** the current user can't be root, since the root user's password must be disabled */
  currentUserIsNotRoot: boolean;
  /** two factor auth must be globally enabled in advanced system settings */
  twoFactorAuthGloballyEnabled: boolean;
  /** two factor auth must be required for SSH globally in advanced system settings */
  twoFactorSshGloballyEnabled: boolean;
  /** the apps service must be completely unconfigured (i.e. no pool set) */
  dockerServiceDisabled: boolean;
  /** the root user's password must be disabled */
  rootPasswordDisabled: [boolean, User | undefined];
  /** the truenas_admin user's password must be disabled */
  adminPasswordDisabled: [boolean, User | undefined];
  /**
   * all users must have 2FA required in order to access the truenas webUI.
   * this is not a hard requirement, but all users that don't have 2FA enabled
   * will be unable to access the webUI after STIG mode is enabled.
   */
  allUsersHave2fa: boolean;
  /**
   * the currently logged-in user has a 2FA secret configured.
   */
  currentUserIs2fa: boolean;
  /**
   * the currently logged-in user's session was initiated with 2FA.
   */
  currentSessionIs2fa: boolean;
}

/**
 * helper type that represents a missing STIG requirement.
 * if neither `navigateTo` nor `action` is present, the `Configure` button will
 * not be shown in the requirements list.
 */
interface MissingStigRequirement {
  /** what text to display on the action/navigation link */
  configureTitle: string;
  /** message to display when requirement is unfulfilled */
  message: string;
  /** route to navgiate to when clicking the configure button. */
  navigateTo?: string[];
  /** element to highlight when navigating */
  highlightElement?: string;
  /** the action to perform upon navigation */
  action?: () => void;
}

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
    MatProgressBar,
  ],
})
export class SystemSecurityFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private slideIn = inject(SlideIn);
  private navigateAndHighlightService = inject(NavigateAndHighlightService);
  private window = inject<Window>(WINDOW);
  private router = inject(Router);
  slideInRef = inject<SlideInRef<SystemSecurityConfig, boolean>>(SlideInRef);

  protected readonly stigRequirements = stigPasswordRequirements;
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  private readonly stigValidatorFn = this.stigValidator.bind(this);

  form = this.formBuilder.group({
    // if STIG is enabled, then FIPS mode *must* also be enabled since FIPS is part of STIG
    enable_fips: [false, this.stigValidatorFn],
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
      [Validators.min(8), Validators.max(128), this.stigValidatorFn],
    ],
    password_history_length: [
      null as number | null,
      [Validators.min(1), Validators.max(10), this.stigValidatorFn],
    ],
  });

  complexityRulesetLabels$ = of(passwordComplexityRulesetLabels).pipe(
    map((rulesets) => mapToOptions(rulesets, this.translate)),
  );

  private systemSecurityConfig = signal<SystemSecurityConfig>(this.slideInRef.getData());
  protected isStigEnabled = signal<boolean>(false);
  loadingStigRequirements = signal<boolean>(false);
  protected missingStigRequirements = signal<MissingStigRequirement[]>([]);
  protected missingStigWarnings = signal<MissingStigRequirement[]>([]);
  private twoFactorConfig = signal<GlobalTwoFactorConfig | null>(null);

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    if (this.systemSecurityConfig()) {
      this.initSystemSecurityForm();
      if (this.systemSecurityConfig().enable_gpos_stig) {
        this.setupStigRequirements();
      }
    }
  }

  /**
   * make all API calls necessary to determine whether or not we can enable STIG mode.
   * will set the `loadingStigRequirements` signal for the form and unset it when the requirements
   * have been retrieved from the API.
   */
  private setupStigRequirements(): void {
    // bail early if stig mode is already enabled, since all requirements must already be satisfied.
    if (this.slideInRef.getData().enable_gpos_stig) {
      return;
    }

    // also, if we're already loading STIG requirements, then don't do anything since
    // we don't want to make duplicate API calls while waiting on the last ones to finish.
    if (this.loadingStigRequirements()) {
      return;
    }

    this.missingStigRequirements.set([]);
    this.missingStigWarnings.set([]);
    this.loadingStigRequirements.set(true);

    // firstly, get some API data that we need to determine if STIG is even possible to
    // be enabled at this moment.
    const twoFactorConfig$ = this.api.call('auth.twofactor.config').pipe(
      tap((twoFactorConfig) => this.twoFactorConfig.set(twoFactorConfig)),
      map((twoFactorConfig): Partial<StigEnablementRequirements> => ({
        twoFactorAuthGloballyEnabled: twoFactorConfig.enabled,
        twoFactorSshGloballyEnabled: twoFactorConfig.services ? twoFactorConfig.services.ssh : false,
      })),
    );
    const dockerServiceConfig$ = this.api.call('docker.status').pipe(
      map((dockerServiceConfig): Partial<StigEnablementRequirements> => ({
        dockerServiceDisabled: dockerServiceConfig.status === DockerStatus.Unconfigured,
      })),
    );
    const userConfig$ = this.api.call('user.query', [[['local', '=', true]]]).pipe(
      map((userConfig): Partial<StigEnablementRequirements> => {
        const rootUser: User | undefined = userConfig.find((user) => user.username === 'root');
        const truenasAdminUser: User | undefined = userConfig.find((user) => user.username === 'truenas_admin');
        return {
          // if either account is missing, then its password is technically disabled and the requirement is met
          rootPasswordDisabled: [rootUser ? rootUser.password_disabled : true, rootUser],
          adminPasswordDisabled: [truenasAdminUser ? truenasAdminUser.password_disabled : true, truenasAdminUser],
        };
      }),
    );
    const user2faConfig$ = this.api.call('user.query', [[
      ['builtin', '=', false],
      ['twofactor_auth_configured', '=', false],
      ['locked', '=', false],
      ['password_disabled', '=', false],
      ['roles', '!=', []],
    ]]).pipe(
      map((user2faConfig): Partial<StigEnablementRequirements> => ({
        allUsersHave2fa: user2faConfig.length === 0,
      })),
    );
    const userAuthDetails$ = forkJoin([
      this.api.call('auth.me'),
      this.api.call('auth.sessions'),
    ]).pipe(
      map(([myUser, sessionsList]) => ({
        user: myUser,
        session: sessionsList.find((session) => session.current),
      })),
      map((me): Partial<StigEnablementRequirements> => ({
        currentUserIsNotRoot: me.user.pw_name !== 'root' && me.user.pw_name !== 'truenas_admin',
        currentUserIs2fa: me.user.two_factor_config.secret_configured,
        currentSessionIs2fa: me.session.credentials === CredentialType.TwoFactor,
      })),
    );

    // and combine all that data into one big `StigEnablementRequirements` structure
    const combined$ = zip(
      twoFactorConfig$,
      dockerServiceConfig$,
      userConfig$,
      user2faConfig$,
      userAuthDetails$,
    ).pipe(
      map((details: Partial<StigEnablementRequirements>[]): Partial<StigEnablementRequirements> => {
        // merge all details into one big `StigEnablementRequirements`
        return details.reduce((acc, detail) => ({ ...acc, ...detail }), {} as StigEnablementRequirements);
      }),
      this.errorHandler.withErrorHandler(),
      finalize(() => this.loadingStigRequirements.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );

    // then, for each property, check it and push a `MissingStigRequirement` to our internal list
    // when any of them are missing or false.
    combined$.subscribe((enablementRequirements) => {
      const requirements: MissingStigRequirement[] = [];
      const warnings: MissingStigRequirement[] = [];

      if (!enablementRequirements?.currentUserIsNotRoot) {
        requirements.push({
          configureTitle: 'Log out',
          message: 'You must log in as a user other than root with admin access, because root must have its password disabled.',
          action: this.logout.bind(this),
        });
      }

      if (!enablementRequirements?.twoFactorAuthGloballyEnabled) {
        requirements.push({
          configureTitle: 'Enable',
          message: 'Global Two-Factor Authentication must be enabled.',
          action: this.openGlobalTwoFactorForm.bind(this, 'global'),
        });
      }

      if (!enablementRequirements.twoFactorSshGloballyEnabled) {
        requirements.push({
          configureTitle: 'Enable',
          message: 'SSH Two-Factor Authentication must be enabled.',
          action: this.openGlobalTwoFactorForm.bind(this, 'ssh'),
        });
      }

      if (!enablementRequirements.dockerServiceDisabled) {
        requirements.push({
          configureTitle: 'Disable',
          message: 'The apps service must be disabled and the pool unset.',
          navigateTo: ['/apps'],
          highlightElement: 'app-settings',
        });
      }

      if (!enablementRequirements.rootPasswordDisabled[0]) {
        requirements.push({
          configureTitle: 'Disable',
          message: 'The root user must have their password disabled.',
          action: this.openUserEditForm.bind(this, enablementRequirements.rootPasswordDisabled[1]),
        });
      }

      if (!enablementRequirements.adminPasswordDisabled[0]) {
        requirements.push({
          configureTitle: 'Disable',
          message: 'The truenas_admin user must have their password disabled.',
          action: this.openUserEditForm.bind(this, enablementRequirements.adminPasswordDisabled[1]),
        });
      }

      if (!enablementRequirements.currentUserIs2fa && !enablementRequirements.currentSessionIs2fa) {
        requirements.push({
          configureTitle: 'Configure 2FA',
          message: 'The current user must be logged in with 2FA. After configuring 2FA, you will have to log out and log back in again.',
          navigateTo: ['/two-factor-auth'],
        });
      } else if (!enablementRequirements.currentUserIs2fa) {
        requirements.push({
          configureTitle: 'Configure 2FA',
          message: 'You must have 2FA configured for your user.',
          navigateTo: ['/two-factor-auth'],
        });
      } else if (!enablementRequirements.currentSessionIs2fa) {
        requirements.push({
          configureTitle: 'Log out',
          message: 'You must be logged in with 2FA. If you have already configured 2FA, you will have to log out and back in again.',
          action: this.logout.bind(this),
        });
      }

      if (!enablementRequirements.allUsersHave2fa) {
        warnings.push({
          configureTitle: 'Configure',
          message: 'All users must have 2FA enabled and setup.',
          navigateTo: ['/credentials/users'],
        });
      }

      // ensure that the user hasn't quickly unchecked the button, since if they have,
      // then we need to *not* apply any of the errors.
      if (!this.form.controls.enable_gpos_stig.value) {
        this.clearStigRequirementsError();
        return;
      }

      this.missingStigRequirements.set(requirements);
      this.missingStigWarnings.set(warnings);

      // prevent saving the form if we have any STIG requirements unmet
      if (requirements.length > 0) {
        this.form.controls.enable_gpos_stig.setErrors({ stigRequirementsNotMet: true });
      } else {
        this.clearStigRequirementsError();
      }
    });
  }

  private clearStigRequirementsError(): void {
    // and remove that validation error if there aren't any
    const errors = this.form.controls.enable_gpos_stig.errors;
    if (errors?.['stigRequirementsNotMet']) {
      delete errors['stigRequirementsNotMet'];
      const hasErrors = Object.keys(errors).length > 0;
      this.form.controls.enable_gpos_stig.setErrors(hasErrors ? errors : null);
    }
  }

  private stigValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.isStigEnabled?.() && !this.form?.controls.enable_gpos_stig.value) {
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
      case 'enable_fips':
        if (!value) return {
          stigRequiresFips: {
            message: this.translate.instant(
              'STIG requires FIPS to be enabled.',
            ),
          },
        };
        break;
      case 'min_password_age':
        if (value !== null && (value as number) < stigPasswordRequirements.minPasswordAge) {
          return {
            stigMinPasswordAge: {
              required: stigPasswordRequirements.minPasswordAge,
              actual: value as number,
              message: this.translate.instant(
                'STIG requires minimum password age of {days} days.',
                { days: stigPasswordRequirements.minPasswordAge },
              ),
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
              message: this.translate.instant(
                'STIG requires maximum password age of {days} days.',
                { days: stigPasswordRequirements.maxPasswordAge },
              ),
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
              message: this.translate.instant(
                'STIG requires minimum password length of {length} characters.',
                { length: stigPasswordRequirements.minPasswordLength },
              ),
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
              message: this.translate.instant(
                'STIG requires password history length of {length} passwords.',
                { length: stigPasswordRequirements.passwordHistoryLength },
              ),
            },
          };
        }
        break;
      case 'password_complexity_ruleset':
        if (value && Array.isArray(value)) {
          const requiredComplexity = [...stigPasswordRequirements.passwordComplexity];
          const hasAllRequired = requiredComplexity.every((req) => (value as unknown[]).includes(req));
          if (!hasAllRequired) {
            return {
              stigPasswordComplexity: {
                required: requiredComplexity,
                actual: value,
                message: this.translate.instant(
                  'STIG requires Upper, Lower, Number, and Special complexity rules.',
                ),
              },
            };
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
      takeUntilDestroyed(this.destroyRef),
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      callback();
    });
  }

  private saveSettings(values: SystemSecurityConfig): void {
    const valuesToSave = { ...values };
    if (valuesToSave.password_complexity_ruleset) {
      valuesToSave.password_complexity_ruleset = {
        $set: valuesToSave.password_complexity_ruleset as unknown as PasswordComplexityRuleset[],
      };
    }

    this.dialogService.jobDialog(
      this.api.job('system.security.update', [valuesToSave]),
      {
        title: this.translate.instant('Saving settings'),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((stigEnabled) => {
        this.isStigEnabled.set(stigEnabled);
        if (stigEnabled) {
          this.setupStigRequirements();

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
          this.missingStigRequirements.set([]);
          this.missingStigWarnings.set([]);
        }

        Object.keys(this.form.controls).forEach((key) => {
          if (key !== 'enable_gpos_stig' && key !== 'enable_fips') {
            const control = this.form.controls[key as keyof typeof this.form.controls];
            control.updateValueAndValidity();
          }
        });
      });
  }

  protected handleRequirementAction(requirement: MissingStigRequirement): void {
    // Mark form as pristine to avoid unsaved changes dialog
    this.form.markAsPristine();
    this.slideInRef.close({ response: false });

    if (requirement.navigateTo) {
      this.navigateAndHighlightService.navigateAndHighlight(
        requirement.navigateTo,
        requirement?.highlightElement,
      );
    } else if (requirement.action) {
      requirement.action();
    }
  }

  /**
   * after `slideInAnimationDuration` milliseconds, highlight the element with ID `elementName`
   * @param elementName the element ID to highlight
   */
  private delayHighlightElement(elementName: string): void {
    setTimeout(() => {
      const htmlElement = this.window.document.getElementById(elementName);
      if (htmlElement) {
        this.navigateAndHighlightService.scrollIntoView(htmlElement);
      }
    }, slideInAnimationDuration);
  }

  private logout(): void {
    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/signin']);
      });
  }

  private openGlobalTwoFactorForm(highlight: 'global' | 'ssh'): void {
    const config = this.twoFactorConfig();
    if (config) {
      const elementName = highlight === 'global' ? 'enable-2fa-global' : 'enable-2fa-ssh';
      this.slideIn.open(GlobalTwoFactorAuthFormComponent, { data: config });
      this.delayHighlightElement(elementName);
    }
  }

  private openUserEditForm(user: User): void {
    this.slideIn.open(UserFormComponent, { data: user });
    this.delayHighlightElement('disablePasswordCheckbox');
  }
}
