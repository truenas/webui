import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TwoFactorComponent } from 'app/pages/system/two-factor/two-factor.component';
import { DialogService, WebSocketService } from 'app/services';

describe('TwoFactorComponent', () => {
  let spectator: Spectator<TwoFactorComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: TwoFactorComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('auth.twofactor.config', {
          enabled: false,
          id: 1,
          interval: 30,
          otp_digits: 6,
          secret: null,
          services: { ssh: false },
          window: 0,
        } as TwoFactorConfig),
        mockCall('auth.twofactor.provisioning_uri', 'otpauth://totp/iXsystems:truenas.local%40TrueNAS?secret=None&issuer=iXsystems'),
        mockCall('auth.twofactor.renew_secret'),
        mockCall('auth.twofactor.update'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads uri and puts it in the field', async () => {
    const gidInput = await loader.getHarness(IxInputHarness.with({ label: 'Provisioning URI (includes Secret - Read only):' }));
    const value = await gidInput.getValue();

    expect(ws.call).toHaveBeenCalledWith('auth.twofactor.provisioning_uri');
    expect(value).toBe('otpauth://totp/iXsystems:truenas.local%40TrueNAS?secret=None&issuer=iXsystems');
  });

  it('loads current config and show them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('auth.twofactor.config');
    expect(values).toEqual({
      'One-Time Password (OTP) Digits': '6',
      Interval: '30',
      Window: '0',
      'Enable Two-Factor Auth for SSH': false,
      'Secret (Read only)': '',
      'Provisioning URI (includes Secret - Read only):': 'otpauth://totp/iXsystems:truenas.local%40TrueNAS?secret=None&issuer=iXsystems',
    });
  });

  it('sends an update payload to websocket when settings are updated and saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'One-Time Password (OTP) Digits': '6',
      Interval: '30',
      Window: '0',
      'Enable Two-Factor Auth for SSH': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('auth.twofactor.update', [{
      enabled: false,
      interval: 30,
      otp_digits: 6,
      services: { ssh: false },
      window: 0,
    }]);
  });
});
