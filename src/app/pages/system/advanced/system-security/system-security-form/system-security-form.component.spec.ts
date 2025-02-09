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
};

describe('SystemSecurityFormComponent', () => {
  let spectator: Spectator<SystemSecurityFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: SystemSecurityFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectSystemInfo, value: { hostname: 'host.truenas.com' } },
          { selector: selectIsHaLicensed, value: true },
        ],
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
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
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
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

    it('saves FIPS config when form is filled and Save is pressed', async () => {
      await form.fillForm({
        'Enable FIPS': true,
        'Enable General Purpose OS STIG compatibility mode': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.security.update', [{
        enable_fips: true,
        enable_gpos_stig: true,
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'System Security Settings Updated.',
      );
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

    it('loads and shows current System Security config', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        'Enable FIPS': false,
        'Enable General Purpose OS STIG compatibility mode': false,
      });
    });
  });
});
