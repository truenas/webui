import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { helptext } from 'app/helptext/system/2fa';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { IxWarningComponent } from 'app/modules/ix-forms/components/ix-warning/ix-warning.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { QrDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-dialog/qr-dialog.component';
import { RenewTwoFactorDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/renew-two-factor-dialog/renew-two-factor-dialog.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/components/two-factor/two-factor.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('TwoFactorComponent', () => {
  let spectator: Spectator<TwoFactorComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: TwoFactorComponent,
    imports: [
      TestIdModule,
    ],
    declarations: [
      MockComponent(IxWarningComponent),
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => {
          return {
            afterClosed: jest.fn(() => of(true)),
          };
        }),
      }),
      mockProvider(AuthService, {
        user$: of({
          username: 'dummy',
          twofactor_auth_configured: true,
        } as LoggedInUser),
        renewUser2FaSecret: jest.fn(() => of({})),
        getUserTwoFactorConfig: jest.fn(() => of({ provisioning_uri: 'provisioning_uri', interval: 30, otp_digits: 6, secret_configured: true } as UserTwoFactorConfig)),
        getGlobalTwoFactorConfig: jest.fn(() => of({ enabled: false } as GlobalTwoFactorConfig)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows warning when global setting is disabled', () => {
    jest.spyOn(spectator.inject(AuthService), 'getGlobalTwoFactorConfig').mockImplementation(() => of({
      enabled: true,
    }));
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext.two_factor.global_disabled);
  });

  it('shows warning when global setting is enabled but user disabled', () => {
    jest.spyOn(spectator.inject(WebSocketService), 'call').mockImplementationOnce(() => of({
      id: 1,
      enabled: true,
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

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(RenewTwoFactorDialogComponent);
    expect(spectator.component.showQrCode).toHaveBeenCalled();
  });

  it('opens qr dialog when button clicked', async () => {
    const qrBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Show QR' }));
    await qrBtn.click();

    expect(spectator.inject(AuthService).getUserTwoFactorConfig).toHaveBeenCalled();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      QrDialogComponent,
      {
        width: '300px',
        data: { qrInfo: 'provisioning_uri' },
      },
    );
  });
});
