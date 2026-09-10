import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnBannerComponent, TnBannerHarness, TnButtonHarness, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { MockComponent, ngMocks } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective } from 'ng-qrcode';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { helptext2fa } from 'app/helptext/system/2fa';
import { AuthSession } from 'app/interfaces/auth-session.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';

// `MockComponent(QrViewerComponent)` deep-mocks that child's whole import graph,
// which now includes TnBannerComponent — the primitive this component renders itself.
// Keep it real so the page's own banner still renders (ng-mocks#8634).
ngMocks.globalKeep(TnBannerComponent);

describe('TwoFactorComponent', () => {
  let spectator: Spectator<TwoFactorComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  // The pending-verification flag has to survive a component instance — that is what
  // brings a user who reloaded mid-setup back to the confirmation step.
  const storage = new Map<string, string>();

  const createComponent = createComponentFactory({
    component: TwoFactorComponent,
    imports: [
      QrCodeComponent,
      QrCodeDirective,
      MockComponent(QrViewerComponent),
      MockComponent(CopyButtonComponent),
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
      mockWindow({
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => storage.set(key, value),
        },
      }),
      mockApi([
        mockCall('user.renew_2fa_secret'),
        mockCall('user.unset_2fa_secret'),
        mockCall('auth.sessions', [{ current: true, credentials: CredentialType.TwoFactor } as AuthSession]),
      ]),
      mockProvider(AuthService, {
        user$: of({
          pw_name: 'dummy',
          two_factor_config: {
            secret_configured: true,
          },
        } as LoggedInUser),
        userTwoFactorConfig$: of({
          provisioning_uri: 'somepath://here/TrueNAS:first-test?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
          interval: 30,
          otp_digits: 6,
          secret_configured: true,
        } as UserTwoFactorConfig),
        getGlobalTwoFactorConfig: jest.fn(() => of({ enabled: false } as GlobalTwoFactorConfig)),
        refreshUser: jest.fn(() => of(undefined)),
      }),
    ],
  });

  beforeEach(() => {
    storage.clear();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows the QR code viewer with correct provisioning URI when 2FA is configured', () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const qrViewer = spectator.query(QrViewerComponent);
    expect(qrViewer).toBeTruthy();
    expect(qrViewer).toHaveProperty('qrInfo', 'somepath://here/TrueNAS:first-test?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  });

  it('displays the secret from provisioning URI in the component', () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const secretElement = spectator.query('.secret p');
    expect(secretElement).toBeTruthy();
    expect(secretElement).toHaveText('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  });

  it('shows a copy button with the correct secret', () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const copyButton = spectator.query(CopyButtonComponent);
    expect(copyButton).toBeTruthy();
    expect(copyButton).toHaveProperty('text', 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  });

  it('shows warning when global setting is disabled', async () => {
    spectator.component.globalTwoFactorEnabled.set(false);
    spectator.detectChanges();

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain(helptext2fa.globallyDisabled);
  });

  it('shows warning when global setting is enabled but user disabled', async () => {
    spectator.component.globalTwoFactorEnabled.set(true);
    spectator.component.userTwoFactorAuthConfigured.set(false);
    spectator.detectChanges();

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain(helptext2fa.enabledGloballyButNotForUser);
  });

  it('shows warning when global setting is enabled and user enabled', async () => {
    spectator.component.globalTwoFactorEnabled.set(true);
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.component.currentSessionIs2fa.set(true);
    spectator.detectChanges();

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain(helptext2fa.allSetUp);
  });

  it('renews secret when button is clicked', async () => {
    const renewBtn = await loader.getHarness(TnButtonHarness.with({ label: 'Renew 2FA Secret' }));
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

    const unsetBtn = await loader.getHarness(TnButtonHarness.with({ label: 'Unset 2FA Secret' }));
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

    const skipBtn = await loader.getHarness(TnButtonHarness.with({ label: 'Skip Setup' }));
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

  it('shows unset button only when 2FA is configured', async () => {
    const unsetButtons = TnButtonHarness.with({ label: 'Unset 2FA Secret' });

    spectator.component.userTwoFactorAuthConfigured.set(false);
    spectator.detectChanges();

    expect(await loader.getAllHarnesses(unsetButtons)).toHaveLength(0);

    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    expect(await loader.getAllHarnesses(unsetButtons)).toHaveLength(1);
  });

  describe('confirming the new secret', () => {
    // RFC 4226 test vector for the reference seed above at counter 1, i.e. the time
    // step covering 30-59s. Pinning Date.now() keeps the code the one that verifies.
    const validCode = '287082';

    async function generateSecret(): Promise<void> {
      const configureBtn = await loader.getHarness(TnButtonHarness.with({ label: 'Renew 2FA Secret' }));
      await configureBtn.click();
      spectator.detectChanges();
    }

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(59_000);
    });

    afterEach(() => {
      jest.spyOn(Date, 'now').mockRestore();
    });

    it('asks for a code from the authenticator app once a secret is generated', async () => {
      await generateSecret();

      expect(spectator.component.pendingVerification()).toBe(true);

      const banner = await loader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.verification.pending);
      expect(await loader.getHarnessOrNull(TnInputHarness)).not.toBeNull();
    });

    it('hides renew and unset until the code is confirmed', async () => {
      await generateSecret();

      expect(await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Renew 2FA Secret' }))).toHaveLength(0);
      expect(await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Unset 2FA Secret' }))).toHaveLength(0);
    });

    it('rejects a code that does not match the secret and stays in confirmation', async () => {
      await generateSecret();

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue('000000');
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      const field = await loader.getHarness(TnFormFieldHarness);
      expect(await field.getErrorMessage()).toBe(helptext2fa.verification.invalid);
      expect(spectator.component.pendingVerification()).toBe(true);
    });

    it('completes setup when the code matches the secret', async () => {
      await generateSecret();

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      expect(spectator.component.pendingVerification()).toBe(false);
      expect(await loader.getHarnessOrNull(TnInputHarness)).toBeNull();
      expect(await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Unset 2FA Secret' }))).toHaveLength(1);
    });

    it('removes the secret when the user cancels instead of confirming', async () => {
      await generateSecret();

      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.cancelBtn }))).click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: helptext2fa.verification.cancel.title,
        message: helptext2fa.verification.cancel.message,
        buttonText: helptext2fa.verification.cancel.btn,
        cancelText: helptext2fa.verification.cancel.cancelBtn,
        hideCheckbox: true,
        buttonColor: 'warn',
      });
      expect(api.call).toHaveBeenCalledWith('user.unset_2fa_secret', ['dummy']);
      expect(spectator.component.pendingVerification()).toBe(false);
    });

    it('resumes confirmation after a reload, so an unconfirmed secret is never left behind', async () => {
      await generateSecret();

      const reloaded = createComponent();
      const reloadedLoader = TestbedHarnessEnvironment.loader(reloaded.fixture);

      expect(reloaded.component.pendingVerification()).toBe(true);
      expect(await reloadedLoader.getHarnessOrNull(TnInputHarness)).not.toBeNull();
    });

    it('reports setup as incomplete while a secret is waiting to be confirmed', async () => {
      const emitted: boolean[] = [];
      spectator.component.setupComplete.subscribe((isComplete) => emitted.push(isComplete));

      await generateSecret();
      expect(emitted.at(-1)).toBe(false);

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      expect(emitted.at(-1)).toBe(true);
    });
  });

  it('shows skip button only in setup dialog when 2FA is not configured', async () => {
    const skipButtons = TnButtonHarness.with({ label: 'Skip Setup' });

    spectator.setInput('isSetupDialog', false);
    spectator.component.userTwoFactorAuthConfigured.set(false);
    spectator.detectChanges();

    expect(await loader.getAllHarnesses(skipButtons)).toHaveLength(0);

    spectator.setInput('isSetupDialog', true);
    spectator.detectChanges();

    expect(await loader.getAllHarnesses(skipButtons)).toHaveLength(1);
  });
});
