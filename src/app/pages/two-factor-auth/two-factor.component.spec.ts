import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective } from 'ng-qrcode';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { helptext2fa } from 'app/helptext/system/2fa';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';

describe('TwoFactorComponent', () => {
  let spectator: Spectator<TwoFactorComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: TwoFactorComponent,
    imports: [
      QrCodeComponent,
      QrCodeDirective,
      MockComponent(WarningComponent),
      MockComponent(QrViewerComponent),
      MockComponent(CopyButtonComponent),
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('user.renew_2fa_secret'),
        mockCall('user.unset_2fa_secret'),
      ]),
      mockProvider(AuthService, {
        user$: of({
          pw_name: 'dummy',
          two_factor_config: {
            secret_configured: true,
          },
        } as LoggedInUser),
        userTwoFactorConfig$: of({
          provisioning_uri: 'somepath://here/TrueNAS:first-test?secret=KYC123',
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
    api = spectator.inject(ApiService);
  });

  it('shows the QR code viewer with correct provisioning URI when 2FA is configured', () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const qrViewer = spectator.query(QrViewerComponent);
    expect(qrViewer).toBeTruthy();
    expect(qrViewer).toHaveProperty('qrInfo', 'somepath://here/TrueNAS:first-test?secret=KYC123');
  });

  it('displays the secret from provisioning URI in the component', () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const secretElement = spectator.query('.secret p');
    expect(secretElement).toBeTruthy();
    expect(secretElement).toHaveText('KYC123');
  });

  it('shows a copy button with the correct secret', () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const copyButton = spectator.query(CopyButtonComponent);
    expect(copyButton).toBeTruthy();
    expect(copyButton).toHaveProperty('text', 'KYC123');
  });

  it('shows warning when global setting is disabled', () => {
    jest.spyOn(spectator.inject(AuthService), 'getGlobalTwoFactorConfig').mockImplementation(() => of({
      enabled: true,
    } as GlobalTwoFactorConfig));
    const warning = spectator.query(WarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext2fa.globallyDisabled);
  });

  it('shows warning when global setting is enabled but user disabled', () => {
    spectator.component.ngOnInit();
    spectator.component.userTwoFactorAuthConfigured.set(false);
    spectator.detectChanges();
    const warning = spectator.query(WarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext2fa.enabledGloballyButNotForUser);
  });

  it('shows warning when global setting is enabled and user enabled', () => {
    spectator.component.ngOnInit();
    spectator.detectChanges();
    const warning = spectator.query(WarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext2fa.allSetUp);
  });

  it('renews secret when button is clicked', async () => {
    const renewBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Renew 2FA Secret' }));
    await renewBtn.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptext2fa.renewSecret.title,
      message: helptext2fa.renewSecret.message,
      hideCheckbox: true,
      buttonText: helptext2fa.renewSecret.btn,
    });

    expect(api.call).toHaveBeenCalledWith('user.renew_2fa_secret', ['dummy', {
      interval: 30,
      otp_digits: 6,
    }]);
  });

  it('unsets 2FA secret when unset button is clicked', async () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const unsetBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Unset 2FA Secret' }));
    await unsetBtn.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Unset Two-Factor Authentication?',
      message: 'Are you sure you want to unset two-factor authentication? '
        + 'This will remove your current 2FA configuration and you will need to set it up again to use 2FA.',
      buttonText: 'Unset 2FA',
      cancelText: 'Cancel',
      hideCheckbox: true,
      buttonColor: 'warn',
    });

    expect(api.call).toHaveBeenCalledWith('user.unset_2fa_secret', ['dummy']);
  });

  it('emits skipSetup event when skip button is clicked in setup dialog', async () => {
    jest.spyOn(spectator.component.skipSetup, 'emit');
    spectator.setInput('isSetupDialog', true);
    spectator.component.userTwoFactorAuthConfigured.set(false);
    spectator.detectChanges();

    const skipBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Skip Setup' }));
    await skipBtn.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Skip Two-Factor Authentication Setup?',
      message: 'Two-factor authentication significantly improves the security of your account. '
        + 'Are you sure you want to skip this setup? You can enable it later from your user settings.',
      buttonText: 'Skip Setup',
      cancelText: 'Continue Setup',
      hideCheckbox: true,
    });

    expect(spectator.component.skipSetup.emit).toHaveBeenCalled();
  });

  it('shows unset button only when 2FA is configured', () => {
    spectator.component.userTwoFactorAuthConfigured.set(false);
    spectator.detectChanges();

    let unsetBtn = spectator.query('button[ixTest="unset-2fa-secret"]');
    expect(unsetBtn).toBeFalsy();

    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    unsetBtn = spectator.query('button[ixTest="unset-2fa-secret"]');
    expect(unsetBtn).toBeTruthy();
  });

  it('shows skip button only in setup dialog when 2FA is not configured', () => {
    spectator.setInput('isSetupDialog', false);
    spectator.component.userTwoFactorAuthConfigured.set(false);
    spectator.detectChanges();

    let skipBtn = spectator.query('button[ixTest="skip-2fa-setup"]');
    expect(skipBtn).toBeFalsy();

    spectator.setInput('isSetupDialog', true);
    spectator.detectChanges();

    skipBtn = spectator.query('button[ixTest="skip-2fa-setup"]');
    expect(skipBtn).toBeTruthy();
  });
});
