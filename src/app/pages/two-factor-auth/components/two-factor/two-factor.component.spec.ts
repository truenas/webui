import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { helptext } from 'app/helptext/system/2fa';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { User } from 'app/interfaces/user.interface';
import { IxWarningComponent } from 'app/modules/ix-forms/components/ix-warning/ix-warning.component';
import { QrDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-dialog/qr-dialog.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/components/two-factor/two-factor.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('TwoFactorComponent', () => {
  let spectator: Spectator<TwoFactorComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: TwoFactorComponent,
    declarations: [
      MockComponent(IxWarningComponent),
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(),
      }),
      mockProvider(AuthService, {
        user$: of({
          username: 'dummy',
          twofactor_auth_configured: true,
        } as LoggedInUser),
        renewUser2FaSecret: jest.fn(() => of({})),
      }),
      mockWebsocket([
        mockCall('auth.twofactor.config', {
          id: 1,
          enabled: false,
          interval: 30,
          otp_digits: 6,
          window: 1,
          services: { ssh: false },
        } as TwoFactorConfig),
        mockCall('user.renew_2fa_secret', {} as User),
        mockCall('user.provisioning_uri', 'provisioning_uri'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows warning when global setting is disabled', () => {
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext.two_factor.global_disabled);
  });

  it('shows warning when global setting is enabled but user disabled', () => {
    jest.spyOn(spectator.inject(WebSocketService), 'call').mockImplementationOnce(() => of({
      id: 1,
      enabled: true,
      interval: 30,
      otp_digits: 6,
      window: 1,
      services: { ssh: false },
    }));
    spectator.component.ngOnInit();
    spectator.component.userTwoFactorAuthConfigured = false;
    spectator.detectChanges();
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext.two_factor.global_enabled_user_disabled);
  });

  it('shows warning when global setting is enabled and user enabled', () => {
    jest.spyOn(spectator.inject(WebSocketService), 'call').mockImplementationOnce(() => of({
      id: 1,
      enabled: true,
      interval: 30,
      otp_digits: 6,
      window: 1,
      services: { ssh: false },
    }));
    spectator.component.ngOnInit();
    spectator.detectChanges();
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext.two_factor.global_enabled_user_enabled);
  });

  it('renews secret when button is clicked', async () => {
    const renewBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Renew 2FA Secret' }));
    jest.spyOn(spectator.component, 'showQrCode').mockImplementation();
    await renewBtn.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptext.two_factor.renewSecret.title,
      message: helptext.two_factor.renewSecret.message,
      hideCheckbox: true,
      buttonText: helptext.two_factor.renewSecret.btn,
    });

    expect(spectator.inject(AuthService).renewUser2FaSecret).toHaveBeenCalled();
    expect(spectator.component.showQrCode).toHaveBeenCalled();
  });

  it('opens qr dialog when button clicked', async () => {
    const qrBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Show QR' }));
    await qrBtn.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'user.provisioning_uri', ['dummy'],
    );

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      QrDialogComponent,
      {
        width: '300px',
        data: { qrInfo: 'provisioning_uri' },
      },
    );
  });
});
