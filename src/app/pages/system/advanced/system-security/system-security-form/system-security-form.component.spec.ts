import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { stigPasswordRequirements } from 'app/constants/stig-password-requirements.constants';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PasswordComplexityRuleset } from 'app/enums/password-complexity-ruleset.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

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
      mockProvider(SystemGeneralService, {
        getProductType: () => ProductType.CommunityEdition,
      }),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(() => fakeSystemSecurityConfig),
        requireConfirmationWhen: jest.fn(),
      }),
      mockAuth(),
      mockProvider(ApiService, {
        call: jest.fn((method: string) => {
          if (method === 'user.query') {
            return of([]);
          }
          if (method === 'auth.twofactor.config') {
            return of({ enabled: false });
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
  });
});
