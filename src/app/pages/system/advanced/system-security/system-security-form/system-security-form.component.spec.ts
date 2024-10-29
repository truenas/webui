import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { FipsService } from 'app/services/fips.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const fakeSystemSecurityConfig: SystemSecurityConfig = {
  enable_fips: false,
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
          { selector: selectIsHaLicensed, value: false },
        ],
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
      mockProvider(SnackbarService),
      mockProvider(SystemGeneralService, {
        getProductType: () => ProductType.Scale,
      }),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        getData: jest.fn(() => fakeSystemSecurityConfig),
      }),
      mockProvider(FipsService, {
        promptForRestart: jest.fn(() => of(undefined)),
      }),
      mockAuth(),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockWebSocket([
        mockJob('system.security.update', fakeSuccessfulJob()),
      ]),
    ],
  });

  describe('System Security config', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('saves FIPS config when form is filled and Save is pressed', async () => {
      await form.fillForm({
        'Enable FIPS': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('system.security.update', [{
        enable_fips: true,
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'System Security Settings Updated.',
      );
    });

    it('prompts to reload when settings are saved and HA is not licensed', async () => {
      await form.fillForm({
        'Enable FIPS': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(FipsService).promptForRestart).toHaveBeenCalled();
    });

    it('does not prompt to restart when settings are saved and HA is licensed, because this is handled in HaFipsEffects', async () => {
      spectator.inject(MockStore).overrideSelector(selectIsHaLicensed, true);

      await form.fillForm({
        'Enable FIPS': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(FipsService).promptForRestart).not.toHaveBeenCalled();
    });

    it('loads and shows current System Security config', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        'Enable FIPS': false,
      });
    });
  });
});
