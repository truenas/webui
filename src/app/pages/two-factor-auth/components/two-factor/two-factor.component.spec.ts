import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { helptext2fa } from 'app/helptext/system/2fa';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxWarningComponent } from 'app/modules/ix-forms/components/ix-warning/ix-warning.component';
import { QrViewerComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-viewer/qr-viewer.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/components/two-factor/two-factor.component';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

describe('TwoFactorComponent', () => {
  let spectator: Spectator<TwoFactorComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: TwoFactorComponent,
    declarations: [
      MockComponent(IxWarningComponent),
      MockComponent(QrViewerComponent),
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebSocket([
        mockCall('user.renew_2fa_secret'),
      ]),
      mockProvider(AuthService, {
        user$: of({
          pw_name: 'dummy',
          two_factor_config: {
            secret_configured: true,
          },
        } as LoggedInUser),
        userTwoFactorConfig$: of({
          provisioning_uri: 'provisioning_uri',
          interval: 30,
          otp_digits: 6,
          secret_configured: true,
        } as UserTwoFactorConfig),
        getGlobalTwoFactorConfig: jest.fn(() => of({ enabled: false } as GlobalTwoFactorConfig)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows warning when global setting is disabled', () => {
    jest.spyOn(spectator.inject(AuthService), 'getGlobalTwoFactorConfig').mockImplementation(() => of({
      enabled: true,
    } as GlobalTwoFactorConfig));
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext2fa.two_factor.global_disabled);
  });

  it('shows warning when global setting is enabled but user disabled', () => {
    spectator.component.ngOnInit();
    spectator.component.userTwoFactorAuthConfigured = false;
    spectator.detectChanges();
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext2fa.two_factor.global_enabled_user_disabled);
  });

  it('shows warning when global setting is enabled and user enabled', () => {
    spectator.component.ngOnInit();
    spectator.detectChanges();
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext2fa.two_factor.global_enabled_user_enabled);
  });

  it('renews secret when button is clicked', async () => {
    const renewBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Renew 2FA Secret' }));
    await renewBtn.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptext2fa.two_factor.renewSecret.title,
      message: helptext2fa.two_factor.renewSecret.message,
      hideCheckbox: true,
      buttonText: helptext2fa.two_factor.renewSecret.btn,
    });

    expect(ws.call).toHaveBeenCalledWith('user.renew_2fa_secret', ['dummy', {
      interval: 30,
      otp_digits: 6,
    }]);
  });
});
