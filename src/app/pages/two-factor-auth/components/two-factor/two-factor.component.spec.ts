import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatListItemHarness } from '@angular/material/list/testing';
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
import { DialogService, WebSocketService } from 'app/services';
import { AuthService } from 'app/services/auth/auth.service';

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

  it('shows global config', async () => {
    const matList = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => matList.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Global 2FA: Disabled',
      'Interval: 30',
      'OTP Digits: 6',
      'Window: 1',
      'Two Factor Authentication for SSH: Disabled',
    ]);
  });

  it('shows warning when global setting is disabled', () => {
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext.two_factor.enabled_status_false);
  });

  it('renews secret when button is clicked', async () => {
    const renewBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Renew 2FA Secret' }));
    await renewBtn.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptext.two_factor.renewSecret.title,
      message: helptext.two_factor.renewSecret.message,
      hideCheckbox: true,
      buttonText: helptext.two_factor.renewSecret.btn,
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'user.renew_2fa_secret', ['dummy'],
    );
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
