import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const fakeSystemSecurityConfig: SystemSecurityConfig = {
  enable_fips: false,
};

describe('SystemSecurityFormComponent', () => {
  let spectator: Spectator<SystemSecurityFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: SystemSecurityFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectSystemInfo, value: { hostname: 'host.truenas.com' } },
        ],
      }),
      mockWebSocket([
        mockCall('system.security.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
      mockProvider(SnackbarService),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(SystemGeneralService, {
        getProductType: () => ProductType.Scale,
      }),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        getData: jest.fn(() => fakeSystemSecurityConfig),
      }),
      mockAuth(),
    ],
  });

  describe('System Security config', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      ws = spectator.inject(WebSocketService);
    });

    it('saves SMTP config when form is filled and Save is pressed', async () => {
      await form.fillForm({
        'Enable FIPS': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('system.security.update', [{
        enable_fips: true,
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'System Security Settings Updated.',
      );
    });

    it('loads and shows current System Security config', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        'Enable FIPS': false,
      });
    });
  });
});
