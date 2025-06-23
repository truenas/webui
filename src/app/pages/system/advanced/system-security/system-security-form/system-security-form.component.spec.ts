import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
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
        confirm: jest.fn(() => of()),
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
      mockApi([
        mockJob('system.security.update', fakeSuccessfulJob()),
      ]),
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
        'Enable General Purpose OS STIG compatibility mode': true,
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
        enable_gpos_stig: true,
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

    it('enables FIPS when STIG is enabled first', async () => {
      await form.fillForm({
        'Enable General Purpose OS STIG compatibility mode': true,
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
  });
});
