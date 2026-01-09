import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { catchError, EMPTY, Observable, of, throwError } from 'rxjs';
import { stigPasswordRequirements } from 'app/constants/stig-password-requirements.constants';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { PasswordComplexityRuleset } from 'app/enums/password-complexity-ruleset.enum';
import { DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

type MockParams = unknown[] | object | void;

const fakeSystemSecurityConfig: SystemSecurityConfig = {
  enable_fips: false,
  enable_gpos_stig: false,
  min_password_age: 10,
  max_password_age: 90,
  password_complexity_ruleset: { $set: [PasswordComplexityRuleset.Upper, PasswordComplexityRuleset.Lower] },
  min_password_length: 12,
  password_history_length: 5,
};

describe('SystemSecurityFormComponent', () => {
  let spectator: Spectator<SystemSecurityFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: SystemSecurityFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectSystemInfo, value: { hostname: 'host.truenas.com' } },
          { selector: selectIsHaLicensed, value: true },
        ],
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({ afterClosed: () => of(undefined) })),
      }),
      mockProvider(SnackbarService),
      mockProvider(SystemGeneralService),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(() => fakeSystemSecurityConfig),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
      }),
      mockProvider(Router, {
        navigate: jest.fn(),
      }),
      mockAuth(),
      mockProvider(ApiService, {
        call: jest.fn((method: string) => {
          if (method === 'user.query') {
            return of([]);
          }
          if (method === 'auth.twofactor.config') {
            return of({ enabled: true, services: { ssh: true } });
          }
          if (method === 'docker.status') {
            return of({ status: DockerStatus.Unconfigured } as { status: DockerStatus });
          }
          return of(null);
        }),
        job: jest.fn(() => fakeSuccessfulJob()),
      }),
    ],
  });

  describe('System Security config', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);

      const mockAuthService = spectator.inject(MockAuthService);
      jest.spyOn(mockAuthService, 'clearAuthToken').mockImplementation();
    });

    it('sets up form dirty confirmation', () => {
      const slideInRef = spectator.inject(SlideInRef);
      const requireConfirmationSpy = jest.spyOn(slideInRef, 'requireConfirmationWhen');

      expect(requireConfirmationSpy).toHaveBeenCalled();

      // Get the callback function that was passed
      const confirmationCallback = requireConfirmationSpy.mock.calls[0][0];

      // Test when form is pristine
      spectator.component.form.markAsPristine();
      confirmationCallback().subscribe((result) => {
        expect(result).toBe(false);
      });

      // Test when form is dirty
      spectator.component.form.markAsDirty();
      confirmationCallback().subscribe((result) => {
        expect(result).toBe(true);
      });
    });

    it('saves full system security config when Save is clicked', async () => {
      await form.fillForm({
        'Enable FIPS': true,
        'Enable General Purpose OS STIG compatibility mode': false,
        'Min Password Age': 15,
        'Max Password Age': 120,
        'Min Password Length': 10,
        'Password History Length': 4,
        'Password Complexity Ruleset': ['Upper', 'Lower'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.security.update', [{
        enable_fips: true,
        enable_gpos_stig: false,
        min_password_age: 15,
        max_password_age: 120,
        password_complexity_ruleset: { $set: ['UPPER', 'LOWER'] },
        min_password_length: 10,
        password_history_length: 4,
      }]);

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'System Security Settings Updated.',
      );
    });

    it('handles null password_complexity_ruleset when saving', async () => {
      // Set form values with null complexity ruleset
      spectator.component.form.patchValue({
        enable_fips: true,
        enable_gpos_stig: false,
        min_password_age: 15,
        max_password_age: 120,
        min_password_length: 10,
        password_history_length: 4,
        password_complexity_ruleset: null,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.security.update', [{
        enable_fips: true,
        enable_gpos_stig: false,
        min_password_age: 15,
        max_password_age: 120,
        password_complexity_ruleset: null,
        min_password_length: 10,
        password_history_length: 4,
      }]);
    });

    it('handles undefined password_complexity_ruleset when saving', async () => {
      // Set form values with undefined complexity ruleset
      spectator.component.form.patchValue({
        enable_fips: true,
        enable_gpos_stig: false,
        min_password_age: 15,
        max_password_age: 120,
        min_password_length: 10,
        password_history_length: 4,
        password_complexity_ruleset: undefined,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // undefined should be passed as is
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.security.update', [{
        enable_fips: true,
        enable_gpos_stig: false,
        min_password_age: 15,
        max_password_age: 120,
        password_complexity_ruleset: undefined,
        min_password_length: 10,
        password_history_length: 4,
      }]);
    });

    it('handles empty array password_complexity_ruleset when saving', async () => {
      await form.fillForm({
        'Enable FIPS': true,
        'Enable General Purpose OS STIG compatibility mode': false,
        'Min Password Age': 15,
        'Max Password Age': 120,
        'Min Password Length': 10,
        'Password History Length': 4,
        'Password Complexity Ruleset': [],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.security.update', [{
        enable_fips: true,
        enable_gpos_stig: false,
        min_password_age: 15,
        max_password_age: 120,
        password_complexity_ruleset: { $set: [] },
        min_password_length: 10,
        password_history_length: 4,
      }]);
    });

    it('loads and displays current values from config', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        'Enable FIPS': false,
        'Enable General Purpose OS STIG compatibility mode': false,
        'Min Password Age': '10',
        'Max Password Age': '90',
        'Password Complexity Ruleset': ['Upper', 'Lower'],
        'Min Password Length': '12',
        'Password History Length': '5',
      });
    });

    it('enables FIPS and corrects invalid values when STIG is enabled', async () => {
      await form.fillForm({
        'Min Password Age': 0,
        'Max Password Age': 90,
        'Min Password Length': 10,
        'Password History Length': 3,
        'Password Complexity Ruleset': ['Upper', 'Lower'],
      });

      await form.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const values = await form.getValues();
      expect(values).toMatchObject({
        'Enable FIPS': true,
        'Min Password Age': stigPasswordRequirements.minPasswordAge.toString(),
        'Max Password Age': stigPasswordRequirements.maxPasswordAge.toString(),
        'Min Password Length': stigPasswordRequirements.minPasswordLength.toString(),
        'Password History Length': stigPasswordRequirements.passwordHistoryLength.toString(),
        'Password Complexity Ruleset': ['Upper', 'Lower', 'Number', 'Special'],
      });
    });

    it('preserves valid values when STIG is enabled', async () => {
      await form.fillForm({
        'Min Password Age': 1,
        'Max Password Age': 45,
        'Min Password Length': 16,
        'Password History Length': 6,
        'Password Complexity Ruleset': ['Upper', 'Lower', 'Number', 'Special'],
      });

      await form.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const values = await form.getValues();
      expect(values).toMatchObject({
        'Enable FIPS': true,
        'Min Password Age': '1',
        'Max Password Age': '45',
        'Min Password Length': '16',
        'Password History Length': '6',
        'Password Complexity Ruleset': ['Upper', 'Lower', 'Number', 'Special'],
      });
    });

    it('preserves more restrictive values when STIG is enabled', async () => {
      await form.fillForm({
        'Min Password Age': 2,
        'Max Password Age': 30,
        'Min Password Length': 20,
        'Password History Length': 8,
        'Password Complexity Ruleset': ['Upper', 'Lower', 'Number', 'Special'],
      });

      await form.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const values = await form.getValues();
      expect(values).toMatchObject({
        'Enable FIPS': true,
        'Min Password Age': '2',
        'Max Password Age': '30',
        'Min Password Length': '20',
        'Password History Length': '8',
        'Password Complexity Ruleset': ['Upper', 'Lower', 'Number', 'Special'],
      });
    });

    it('does not disable FIPS when STIG is disabled first', async () => {
      await form.fillForm({
        'Enable FIPS': true,
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      await form.fillForm({
        'Enable General Purpose OS STIG compatibility mode': false,
      });

      expect(await form.getValues()).toMatchObject({
        'Enable FIPS': true,
      });
    });

    it('clears auth token when STIG is enabled', async () => {
      await form.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(MockAuthService).clearAuthToken).toHaveBeenCalled();
    });

    it('validates STIG requirements when STIG mode is enabled', async () => {
      // Enable STIG mode to activate validation
      await form.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      // Try to set values below STIG requirements
      await form.fillForm({
        'Min Password Age': 0, // Below STIG minimum of 1
        'Max Password Age': 90, // Above STIG maximum of 60
        'Min Password Length': 10, // Below STIG minimum of 15
        'Password History Length': 3, // Below STIG minimum of 5
        'Password Complexity Ruleset': ['Upper'], // Missing required complexity rules
      });

      // Form should be invalid due to STIG validation
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('allows editing password settings when STIG is disabled', async () => {
      // Form starts with STIG disabled
      expect(await form.getValues()).toMatchObject({
        'Enable General Purpose OS STIG compatibility mode': false,
      });

      // Set values that would be invalid under STIG
      await form.fillForm({
        'Min Password Age': 1, // This is valid even under basic validation
        'Max Password Age': 365,
        'Min Password Length': 8,
        'Password History Length': 1,
        'Password Complexity Ruleset': ['Upper'],
      });

      // Form should be valid since STIG validation is not active
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('STIG validation', () => {
    let stigSpectator: Spectator<SystemSecurityFormComponent>;
    let stigLoader: HarnessLoader;
    let stigForm: IxFormHarness;

    beforeEach(async () => {
      stigSpectator = createComponent();
      stigLoader = TestbedHarnessEnvironment.loader(stigSpectator.fixture);
      stigForm = await stigLoader.getHarness(IxFormHarness);
    });

    it('displays STIG info message when STIG mode is enabled', async () => {
      await stigForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      stigSpectator.detectChanges();

      const infoMessage = stigSpectator.query('.stig-info');
      expect(infoMessage).toBeTruthy();
      expect(infoMessage?.textContent).toContain('STIG mode is enabled');
    });

    it('validates password complexity with partial rules when STIG is enabled', async () => {
      // Enable STIG mode first
      await stigForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      // Wait for the form to process the STIG toggle and update values
      await stigSpectator.fixture.whenStable();
      stigSpectator.detectChanges();

      // When STIG is enabled, the form automatically adds missing required rules
      // So the values should already include all required complexity rules
      const values = await stigForm.getValues();
      expect(values['Password Complexity Ruleset']).toEqual(['Upper', 'Lower', 'Number', 'Special']);

      // Try to set incomplete complexity rules
      stigSpectator.component.form.controls.password_complexity_ruleset.setValue([
        PasswordComplexityRuleset.Upper,
        PasswordComplexityRuleset.Lower,
      ]);
      stigSpectator.component.form.controls.password_complexity_ruleset.updateValueAndValidity();

      // Check that validation error is set
      expect(stigSpectator.component.form.controls.password_complexity_ruleset.errors).toEqual({
        stigPasswordComplexity: {
          required: stigPasswordRequirements.passwordComplexity,
          actual: [PasswordComplexityRuleset.Upper, PasswordComplexityRuleset.Lower],
          message: 'STIG requires Upper, Lower, Number, and Special complexity rules.',
        },
      });
    });

    it('validates each field type correctly with STIG validator', async () => {
      // Enable STIG mode
      await stigForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      // Test min_password_age validation
      stigSpectator.component.form.controls.min_password_age.setValue(0);
      stigSpectator.component.form.controls.min_password_age.updateValueAndValidity();
      expect(stigSpectator.component.form.controls.min_password_age.errors).toMatchObject({
        stigMinPasswordAge: {
          required: stigPasswordRequirements.minPasswordAge,
          actual: 0,
        },
      });

      // Test max_password_age validation
      stigSpectator.component.form.controls.max_password_age.setValue(90);
      stigSpectator.component.form.controls.max_password_age.updateValueAndValidity();
      expect(stigSpectator.component.form.controls.max_password_age.errors).toMatchObject({
        stigMaxPasswordAge: {
          required: stigPasswordRequirements.maxPasswordAge,
          actual: 90,
        },
      });

      // Test min_password_length validation
      stigSpectator.component.form.controls.min_password_length.setValue(10);
      stigSpectator.component.form.controls.min_password_length.updateValueAndValidity();
      expect(stigSpectator.component.form.controls.min_password_length.errors).toMatchObject({
        stigMinPasswordLength: {
          required: stigPasswordRequirements.minPasswordLength,
          actual: 10,
        },
      });

      // Test password_history_length validation
      stigSpectator.component.form.controls.password_history_length.setValue(3);
      stigSpectator.component.form.controls.password_history_length.updateValueAndValidity();
      expect(stigSpectator.component.form.controls.password_history_length.errors).toMatchObject({
        stigPasswordHistoryLength: {
          required: stigPasswordRequirements.passwordHistoryLength,
          actual: 3,
        },
      });
    });

    it('returns null for valid values when STIG is enabled', async () => {
      // Enable STIG mode
      await stigForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      // Set valid values
      stigSpectator.component.form.controls.min_password_age.setValue(1);
      stigSpectator.component.form.controls.max_password_age.setValue(60);
      stigSpectator.component.form.controls.min_password_length.setValue(15);
      stigSpectator.component.form.controls.password_history_length.setValue(5);
      stigSpectator.component.form.controls.password_complexity_ruleset.setValue([
        PasswordComplexityRuleset.Upper,
        PasswordComplexityRuleset.Lower,
        PasswordComplexityRuleset.Number,
        PasswordComplexityRuleset.Special,
      ]);

      // Update validity
      Object.keys(stigSpectator.component.form.controls).forEach((key) => {
        const control = stigSpectator.component.form.controls[
          key as keyof typeof stigSpectator.component.form.controls
        ];
        control.updateValueAndValidity();
      });

      // Check that there are no STIG-related errors
      expect(stigSpectator.component.form.controls.min_password_age.errors).toBeNull();
      expect(stigSpectator.component.form.controls.max_password_age.errors).toBeNull();
      expect(stigSpectator.component.form.controls.min_password_length.errors).toBeNull();
      expect(stigSpectator.component.form.controls.password_history_length.errors).toBeNull();
      expect(stigSpectator.component.form.controls.password_complexity_ruleset.errors).toBeNull();
    });

    it('handles null values in STIG validator', async () => {
      // Enable STIG mode
      await stigForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      // Set null values
      stigSpectator.component.form.controls.min_password_age.setValue(null);
      stigSpectator.component.form.controls.min_password_age.updateValueAndValidity();

      // Null values should not cause validation errors (they're handled by required validator)
      expect(stigSpectator.component.form.controls.min_password_age.errors).toBeNull();
    });
  });

  describe('2FA warning when enabling STIG', () => {
    let warningSpectator: Spectator<SystemSecurityFormComponent>;
    let warningLoader: HarnessLoader;
    let warningForm: IxFormHarness;
    let apiService: ApiService;
    let dialogService: DialogService;

    beforeEach(async () => {
      jest.clearAllMocks();
      warningSpectator = createComponent();
      warningLoader = TestbedHarnessEnvironment.loader(warningSpectator.fixture);
      warningForm = await warningLoader.getHarness(IxFormHarness);
      apiService = warningSpectator.inject(ApiService);
      dialogService = warningSpectator.inject(DialogService);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shows warning dialog when users without 2FA exist', async () => {
      const usersWithoutTwoFa = [
        { username: 'user1', roles: [{ id: 1 }] } as unknown as User,
        { username: 'user2', roles: [{ id: 2 }] } as unknown as User,
      ];

      jest.spyOn(apiService, 'call').mockImplementation((method: string, params?: MockParams) => {
        if (method === 'user.query') {
          if (Array.isArray(params) && params[0] && Array.isArray(params[0]) && params[0][0]?.[0] === 'local') {
            return of([
              { username: 'root', password_disabled: true } as User,
              { username: 'truenas_admin', password_disabled: true } as User,
            ]);
          }
          return of(usersWithoutTwoFa);
        }
        if (method === 'auth.twofactor.config') {
          return of({ enabled: true, services: { ssh: true } });
        }
        if (method === 'docker.status') {
          return of({ status: DockerStatus.Unconfigured, description: '' });
        }
        return of(null);
      });

      const dialogSpy = jest.spyOn(dialogService, 'confirm').mockReturnValue(of(true) as unknown as Observable<DialogWithSecondaryCheckboxResult>);

      // Enable STIG mode
      await warningForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const saveButton = await warningLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(dialogSpy).toHaveBeenCalledWith({
        title: 'STIG Mode Warning',
        message: expect.stringContaining('user1, user2'),
        buttonText: 'Enable STIG Mode Anyway',
        cancelText: 'Cancel',
        hideCheckbox: true,
      });
    });

    it('does not show warning when all users have 2FA configured', async () => {
      jest.spyOn(apiService, 'call').mockImplementation((method: string, params?: MockParams) => {
        if (method === 'user.query') {
          // Check if this is the local user query (for root/admin check) or the 2FA check
          if (Array.isArray(params) && params[0] && Array.isArray(params[0]) && params[0][0][0] === 'local') {
            // Return mock root and admin users with passwords disabled
            return of([
              { username: 'root', password_disabled: true } as User,
              { username: 'truenas_admin', password_disabled: true } as User,
            ]);
          }
          return of([]); // No users without 2FA
        }
        if (method === 'auth.twofactor.config') {
          return of({ enabled: true, services: { ssh: true } });
        }
        if (method === 'docker.status') {
          return of({ status: DockerStatus.Unconfigured, description: '' });
        }
        return of(null);
      });

      const dialogSpy = jest.spyOn(dialogService, 'confirm');

      // Enable STIG mode
      await warningForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const saveButton = await warningLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(dialogSpy).not.toHaveBeenCalled();
      expect(apiService.job).toHaveBeenCalledWith('system.security.update', expect.any(Array));
    });

    it('cancels STIG enablement when user cancels warning dialog', async () => {
      const usersWithoutTwoFa = [{ username: 'user1', roles: [{ id: 1 }] } as unknown as User];

      jest.spyOn(apiService, 'call').mockImplementation((method: string) => {
        if (method === 'user.query') {
          return of(usersWithoutTwoFa);
        }
        if (method === 'auth.twofactor.config') {
          return of({ enabled: true, services: { ssh: true } });
        }
        if (method === 'docker.status') {
          return of({ status: DockerStatus.Unconfigured });
        }
        return of(null);
      });

      jest.spyOn(dialogService, 'confirm').mockReturnValue(of(false) as unknown as Observable<DialogWithSecondaryCheckboxResult>); // User cancels

      // Enable STIG mode
      await warningForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const saveButton = await warningLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(apiService.job).not.toHaveBeenCalled(); // Save should not proceed
    });

    it('proceeds with save when user confirms warning dialog', async () => {
      const usersWithoutTwoFa = [{ username: 'user1', roles: [{ id: 1 }] } as unknown as User];

      jest.spyOn(apiService, 'call').mockImplementation((method: string) => {
        if (method === 'user.query') {
          return of(usersWithoutTwoFa);
        }
        if (method === 'auth.twofactor.config') {
          return of({ enabled: true, services: { ssh: true } });
        }
        if (method === 'docker.status') {
          return of({ status: DockerStatus.Unconfigured });
        }
        return of(null);
      });

      jest.spyOn(dialogService, 'confirm').mockReturnValue(of(true) as unknown as Observable<DialogWithSecondaryCheckboxResult>); // User confirms

      // Enable STIG mode
      await warningForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const saveButton = await warningLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(apiService.job).toHaveBeenCalledWith('system.security.update', [expect.objectContaining({
        enable_gpos_stig: true,
      })]);
    });

    it('handles API error when checking users and shows error modal', fakeAsync(async () => {
      const error = new Error('API Error');
      const errorHandler = warningSpectator.inject(ErrorHandlerService);

      // Mock showErrorModal to verify it's called with the error and prevent dialog from opening
      const showErrorModalSpy = jest.spyOn(errorHandler, 'showErrorModal').mockReturnValue(EMPTY);

      // We need to mock withErrorHandler to ensure it calls showErrorModal with the error
      // Unfortunately, Jest's type inference for generic methods requires this type assertion
      const errorHandlerSpy = jest.spyOn(errorHandler, 'withErrorHandler') as unknown as jest.SpyInstance<
        ReturnType<ErrorHandlerService['withErrorHandler']>,
        []
      >;
      errorHandlerSpy.mockImplementation(() => {
        return (source$: Observable<unknown>) => {
          return source$.pipe(
            catchError((err: unknown) => {
              errorHandler.showErrorModal(err);
              return EMPTY;
            }),
          );
        };
      });

      jest.spyOn(apiService, 'call').mockImplementation((method: string) => {
        if (method === 'user.query') {
          return throwError(() => error);
        }
        if (method === 'auth.twofactor.config') {
          return of({ enabled: true, services: { ssh: true } });
        }
        if (method === 'docker.status') {
          return of({ status: DockerStatus.Unconfigured });
        }
        return of(null);
      });

      // Enable STIG mode
      await warningForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const saveButton = await warningLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      flush();

      // Verify error modal was shown with the error
      expect(showErrorModalSpy).toHaveBeenCalledWith(error);
      // Verify save was not attempted
      expect(apiService.job).not.toHaveBeenCalled();
    }));

    it('does not check users when disabling STIG', async () => {
      // Mock the component to have STIG enabled initially
      jest.spyOn(warningSpectator.inject(SlideInRef), 'getData').mockReturnValue({
        ...fakeSystemSecurityConfig,
        enable_gpos_stig: true,
      });

      // Re-initialize component with STIG enabled
      warningSpectator.component.ngOnInit();
      warningSpectator.detectChanges();

      // Reset the api.call spy to clear any previous calls
      jest.clearAllMocks();
      const apiCallSpy = jest.spyOn(apiService, 'call').mockImplementation((method: string) => {
        if (method === 'auth.twofactor.config') {
          return of({ enabled: true });
        }
        return of(null);
      });

      // Disable STIG mode
      await warningForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': false,
      });

      const saveButton = await warningLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // Should not call user.query when disabling STIG
      expect(apiCallSpy).not.toHaveBeenCalledWith('user.query', expect.any(Array));
      expect(apiService.job).toHaveBeenCalledWith('system.security.update', [expect.objectContaining({
        enable_gpos_stig: false,
      })]);
    });
  });

  describe('External STIG mode requirements', () => {
    let validationSpectator: Spectator<SystemSecurityFormComponent>;
    let validationLoader: HarnessLoader;
    let validationForm: IxFormHarness;

    // Minimal factory without pre-configured ApiService mocks
    const createValidationComponent = createComponentFactory({
      component: SystemSecurityFormComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockProvider(SlideInRef, {
          close: jest.fn(),
          getData: jest.fn(() => fakeSystemSecurityConfig),
          requireConfirmationWhen: jest.fn(),
        }),
        mockProvider(ErrorHandlerService, {
          withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
        }),
        mockProvider(Router, {
          navigate: jest.fn(),
        }),
        mockAuth(),
        // ApiService mock will be set up in each individual test
        mockProvider(ApiService, {
          call: jest.fn(() => of(null)),
          job: jest.fn(() => fakeSuccessfulJob()),
        }),
      ],
    });

    it('shows all validation errors correctly', async () => {
      // Set up mocks BEFORE creating component
      const apiServiceMock = {
        call: jest.fn((method: string, params?: MockParams) => {
          if (method === 'auth.twofactor.config') {
            // Both global 2FA and SSH 2FA are disabled
            return of({ enabled: false, services: { ssh: false } });
          }
          if (method === 'user.query') {
            // For the user.query call that checks for local users (root/admin)
            if (Array.isArray(params) && params[0] && Array.isArray(params[0]) && params[0][0]?.[0] === 'local') {
              return of([
                { username: 'root', password_disabled: false } as User, // Root password NOT disabled
                { username: 'truenas_admin', password_disabled: false } as User, // Admin password NOT disabled
              ]);
            }
            // For the user.query call that checks for users without 2FA (warning)
            return of([
              { username: 'testuser', roles: [{ id: 1 }], twofactor_auth_configured: false } as unknown as User,
            ]);
          }
          if (method === 'docker.status') {
            // Docker service is configured (not disabled)
            return of({ status: DockerStatus.Running, description: 'Docker is running' });
          }
          return of(null);
        }),
        job: jest.fn(() => fakeSuccessfulJob()),
      };

      // Create component with specific mocks
      validationSpectator = createValidationComponent({
        providers: [
          mockProvider(ApiService, apiServiceMock),
        ],
      });
      validationLoader = TestbedHarnessEnvironment.loader(validationSpectator.fixture);
      validationForm = await validationLoader.getHarness(IxFormHarness);
      validationSpectator.detectChanges();

      // First ensure STIG requirements are met
      await validationForm.fillForm({
        'Min Password Age': 1,
        'Max Password Age': 60,
        'Min Password Length': 15,
        'Password History Length': 5,
        'Password Complexity Ruleset': ['Upper', 'Lower', 'Number', 'Special'],
      });

      await validationForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      // Wait for async operations to complete
      await validationSpectator.fixture.whenStable();
      validationSpectator.detectChanges();

      expect(validationSpectator.component.form.controls.enable_gpos_stig.errors).toEqual({
        stigRequirementsNotMet: true,
      });

      // The error message should be displayed in the mat-error element showing missing requirements
      const errorElement = validationSpectator.query('mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Requirements to enable STIG mode:');

      // Verify all 4 requirement errors are shown
      expect(errorElement?.textContent).toContain('Global Two-Factor Authentication must be enabled.');
      expect(errorElement?.textContent).toContain('SSH Two-Factor Authentication must be enabled.');
      expect(errorElement?.textContent).toContain('The apps service must be disabled and the pool unset.');
      expect(errorElement?.textContent).toContain('The root user and the truenas_admin users must have their passwords disabled.');

      // Verify the warning is shown in mat-hint
      const hintElement = validationSpectator.query('mat-hint');
      expect(hintElement?.textContent).toContain('Optional requirements to enable STIG mode:');
      expect(hintElement?.textContent).toContain('All users must have 2FA enabled and setup.');

      const saveButton = await validationLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('shows no validation errors when all requirements are satisfied', async () => {
      // Set up mocks BEFORE creating component
      const apiServiceMock = {
        call: jest.fn((method: string, params?: MockParams) => {
          if (method === 'auth.twofactor.config') {
            // Both global 2FA and SSH 2FA are enabled
            return of({ enabled: true, services: { ssh: true } });
          }
          if (method === 'user.query') {
            // For the user.query call that checks for local users (root/admin)
            if (Array.isArray(params) && params[0] && Array.isArray(params[0]) && params[0][0]?.[0] === 'local') {
              return of([
                { username: 'root', password_disabled: true } as User, // Root password IS disabled
                { username: 'truenas_admin', password_disabled: true } as User, // Admin password IS disabled
              ]);
            }
            // For the user.query call that checks for users without 2FA - return empty (all users have 2FA)
            return of([]);
          }
          if (method === 'docker.status') {
            // Docker service is unconfigured (disabled)
            return of({ status: DockerStatus.Unconfigured, description: '' });
          }
          return of(null);
        }),
        job: jest.fn(() => fakeSuccessfulJob()),
      };

      // Create component with specific mocks
      validationSpectator = createValidationComponent({
        providers: [
          mockProvider(ApiService, apiServiceMock),
        ],
      });
      validationLoader = TestbedHarnessEnvironment.loader(validationSpectator.fixture);
      validationForm = await validationLoader.getHarness(IxFormHarness);
      validationSpectator.detectChanges();

      // Set valid STIG values
      await validationForm.fillForm({
        'Min Password Age': 1,
        'Max Password Age': 60,
        'Min Password Length': 15,
        'Password History Length': 5,
        'Password Complexity Ruleset': ['Upper', 'Lower', 'Number', 'Special'],
      });

      await validationForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      // Wait for async operations to complete
      await validationSpectator.fixture.whenStable();
      validationSpectator.detectChanges();

      // Check that the form control does NOT have any errors
      expect(validationSpectator.component.form.controls.enable_gpos_stig.errors).toBeNull();

      // Verify no requirement error messages are shown in the DOM
      const errorElements = validationSpectator.queryAll('mat-error');
      const requirementsError = errorElements.find((el) => el.textContent?.includes('Requirements to enable STIG mode:'));
      expect(requirementsError).toBeFalsy();

      // Verify no warning messages are shown in the DOM
      const hintElements = validationSpectator.queryAll('mat-hint');
      const warningsHint = hintElements.find((el) => el.textContent?.includes('Optional requirements to enable STIG mode:'));
      expect(warningsHint).toBeFalsy();

      // The Save button should be enabled
      const saveButton = await validationLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('removes stigRequirementsNotMet error when requirements become satisfied', async () => {
      // Start with all requirements NOT satisfied
      const apiServiceMock = {
        call: jest.fn((method: string, params?: MockParams) => {
          if (method === 'auth.twofactor.config') {
            return of({ enabled: false, services: { ssh: false } });
          }
          if (method === 'user.query') {
            if (Array.isArray(params) && params[0] && Array.isArray(params[0]) && params[0][0]?.[0] === 'local') {
              return of([
                { username: 'root', password_disabled: false } as User,
                { username: 'truenas_admin', password_disabled: false } as User,
              ]);
            }
            return of([]);
          }
          if (method === 'docker.status') {
            return of({ status: DockerStatus.Running, description: 'Docker is running' });
          }
          return of(null);
        }),
        job: jest.fn(() => fakeSuccessfulJob()),
      };

      // Create component with specific mocks
      validationSpectator = createValidationComponent({
        providers: [
          mockProvider(ApiService, apiServiceMock),
        ],
      });
      validationLoader = TestbedHarnessEnvironment.loader(validationSpectator.fixture);
      validationForm = await validationLoader.getHarness(IxFormHarness);
      validationSpectator.detectChanges();

      // Enable STIG to trigger the error
      await validationForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      await validationSpectator.fixture.whenStable();
      validationSpectator.detectChanges();

      // Verify stigRequirementsNotMet error is present
      expect(validationSpectator.component.form.controls.enable_gpos_stig.errors).toEqual({
        stigRequirementsNotMet: true,
      });

      // Now mock all requirements as satisfied
      apiServiceMock.call.mockImplementation((method: string, params?: MockParams) => {
        if (method === 'auth.twofactor.config') {
          return of({ enabled: true, services: { ssh: true } });
        }
        if (method === 'user.query') {
          if (Array.isArray(params) && params[0] && Array.isArray(params[0]) && params[0][0]?.[0] === 'local') {
            return of([
              { username: 'root', password_disabled: true } as User,
              { username: 'truenas_admin', password_disabled: true } as User,
            ]);
          }
          return of([]);
        }
        if (method === 'docker.status') {
          return of({ status: DockerStatus.Unconfigured, description: '' });
        }
        return of(null);
      });

      // Toggle STIG off and on to trigger re-check with new mocks
      await validationForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': false,
      });
      await validationForm.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      await validationSpectator.fixture.whenStable();
      validationSpectator.detectChanges();

      // Verify stigRequirementsNotMet error is removed
      expect(validationSpectator.component.form.controls.enable_gpos_stig.errors).toBeNull();
    });
  });

  describe('STIG Error Navigation Links', () => {
    // Component factory with custom ApiService mock that returns disabled 2FA config
    // and users with passwords enabled (to trigger root/admin password requirement)
    const createTwoFactorTestComponent = createComponentFactory({
      component: SystemSecurityFormComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockProvider(SlideInRef, {
          close: jest.fn(),
          getData: jest.fn(() => fakeSystemSecurityConfig),
          requireConfirmationWhen: jest.fn(),
        }),
        mockProvider(ErrorHandlerService, {
          withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
        }),
        mockProvider(Router, {
          navigate: jest.fn(),
        }),
        mockAuth(),
        mockProvider(ApiService, {
          call: jest.fn((method: string, params?: unknown) => {
            if (method === 'auth.twofactor.config') {
              return of({ enabled: false, services: { ssh: false } });
            }
            if (method === 'user.query') {
              // Check if it's the call for local users (first call in setupStigRequirements)
              if (Array.isArray(params) && params[0]?.[0]?.[0] === 'local') {
                return of([
                  { username: 'root', password_disabled: false } as User,
                  { username: 'truenas_admin', password_disabled: false } as User,
                ]);
              }
              // For the 2FA check call, return empty array
              return of([]);
            }
            if (method === 'docker.status') {
              return of({ status: DockerStatus.Unconfigured });
            }
            return of(null);
          }),
          job: jest.fn(() => fakeSuccessfulJob()),
        }),
      ],
    });

    it('navigates to Users page when clicking Configure for root/admin password requirement', async () => {
      const navigationSpectator = createTwoFactorTestComponent();
      const router = navigationSpectator.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const closeSlideInSpy = jest.spyOn(navigationSpectator.inject(SlideInRef), 'close');

      // Trigger setupStigRequirements - should show root/admin password requirement
      navigationSpectator.component.form.patchValue({ enable_gpos_stig: true });
      navigationSpectator.detectChanges();
      await navigationSpectator.fixture.whenStable();

      // Find the Configure button for the root/admin password requirement
      const errorMessages = navigationSpectator.queryAll('mat-error li');
      const passwordError = errorMessages.find((el) => el.textContent.includes('root user') && el.textContent.includes('truenas_admin'));
      expect(passwordError).toBeTruthy();

      const configureButton = passwordError.querySelector('.link-button') as HTMLElement;
      expect(configureButton).toBeTruthy();

      // Click the Configure button
      configureButton.click();

      expect(closeSlideInSpy).toHaveBeenCalledWith({ response: false });
      expect(navigateSpy).toHaveBeenCalledWith(['/credentials/users']);
    });

    it('navigates to Advanced Settings and opens Global Two-Factor Auth form when clicking Configure', async () => {
      const navigationSpectator = createTwoFactorTestComponent();
      const router = navigationSpectator.inject(Router);
      const slideIn = navigationSpectator.inject(SlideIn);
      const slideInOpenSpy = jest.spyOn(slideIn, 'open');
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const closeSlideInSpy = jest.spyOn(navigationSpectator.inject(SlideInRef), 'close');

      // Trigger setupStigRequirements - should show "Global Two-Factor Authentication" requirement
      navigationSpectator.component.form.patchValue({ enable_gpos_stig: true });
      navigationSpectator.detectChanges();
      await navigationSpectator.fixture.whenStable();

      // Find the Configure button for the 2FA requirement
      const errorMessages = navigationSpectator.queryAll('mat-error li');
      const twoFactorError = errorMessages.find((el) => el.textContent.includes('Global Two-Factor Authentication'));
      expect(twoFactorError).toBeTruthy();

      const configureButton = twoFactorError.querySelector('.link-button') as HTMLElement;
      expect(configureButton).toBeTruthy();

      // Click the Configure button
      configureButton.click();

      // Verify navigation was initiated
      expect(closeSlideInSpy).toHaveBeenCalledWith({ response: false });
      expect(navigateSpy).toHaveBeenCalledWith(['/system/advanced']);

      // Wait for navigation promise to resolve and action to be called
      await navigationSpectator.fixture.whenStable();

      // Verify the Global 2FA form was opened after navigation
      expect(slideInOpenSpy).toHaveBeenCalledWith(
        GlobalTwoFactorAuthFormComponent,
        { data: { enabled: false, services: { ssh: false } } },
      );
    });

    it('marks form as pristine before navigating to avoid unsaved changes dialog', async () => {
      const navigationSpectator = createTwoFactorTestComponent();
      jest.spyOn(navigationSpectator.inject(Router), 'navigate').mockResolvedValue(true);

      // Trigger setupStigRequirements
      navigationSpectator.component.form.patchValue({ enable_gpos_stig: true });
      navigationSpectator.detectChanges();
      await navigationSpectator.fixture.whenStable();

      // Mark form as dirty
      navigationSpectator.component.form.markAsDirty();
      expect(navigationSpectator.component.form.pristine).toBe(false);

      // Find any Configure button and click it
      const configureButton = navigationSpectator.query('.link-button') as HTMLElement;
      expect(configureButton).toBeTruthy();

      configureButton.click();

      // Form should be marked as pristine before navigation
      expect(navigationSpectator.component.form.pristine).toBe(true);
    });
  });
});
