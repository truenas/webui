import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnBannerComponent, TnBannerHarness, TnButtonHarness, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { MockComponent, ngMocks } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective } from 'ng-qrcode';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { helptext2fa } from 'app/helptext/system/2fa';
import { AuthSession } from 'app/interfaces/auth-session.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
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

  // RFC 6238 reference seed, so the codes below are the published test vectors.
  const provisioningUri = 'somepath://here/TrueNAS:first-test?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  // Mutable so a test can start from an account that has no secret yet — the providers
  // themselves cannot be overridden once the first component has instantiated the module.
  const configuredUser = { pw_name: 'dummy', two_factor_config: { secret_configured: true } } as LoggedInUser;

  // The appliance sits in the time step `validCode` belongs to; the browser clock in the
  // tests is parked a step earlier, so only a check using appliance time accepts it.
  const applianceNow = 59_000;
  const browserNow = 5_000;

  const twoFactorConfig = {
    provisioning_uri: provisioningUri,
    interval: 30,
    otp_digits: 6,
    secret_configured: true,
  } as UserTwoFactorConfig;
  const twoFactorConfig$ = new BehaviorSubject(twoFactorConfig);
  const user$ = new BehaviorSubject<LoggedInUser>(configuredUser);

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
          removeItem: (key: string) => storage.delete(key),
        },
      }),
      mockApi([
        mockCall('user.renew_2fa_secret'),
        mockCall('user.unset_2fa_secret'),
        mockCall('auth.sessions', [{ current: true, credentials: CredentialType.TwoFactor } as AuthSession]),
        mockCall('system.info', { datetime: { $date: applianceNow } } as SystemInfo),
      ]),
      mockProvider(AuthService, {
        user$,
        userTwoFactorConfig$: twoFactorConfig$,
        getGlobalTwoFactorConfig: jest.fn(() => of({ enabled: false, window: 0 } as GlobalTwoFactorConfig)),
        refreshUser: jest.fn(() => of(undefined)),
      }),
    ],
  });

  beforeEach(() => {
    storage.clear();
    user$.next(configuredUser);
    twoFactorConfig$.next(twoFactorConfig);
    jest.spyOn(Date, 'now').mockReturnValue(browserNow);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  afterEach(() => {
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('shows the QR code viewer with correct provisioning URI when 2FA is configured', () => {
    spectator.component.userTwoFactorAuthConfigured.set(true);
    spectator.detectChanges();

    const qrViewer = spectator.query(QrViewerComponent);
    expect(qrViewer).toBeTruthy();
    expect(qrViewer).toHaveProperty('qrInfo', provisioningUri);
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
    // RFC 4226 counter 0 — the step before the one `validCode` belongs to.
    const previousStepCode = '755224';

    async function generateSecret(): Promise<void> {
      const configureBtn = await loader.getHarness(TnButtonHarness.with({ label: 'Renew 2FA Secret' }));
      await configureBtn.click();
      spectator.detectChanges();
    }

    it('asks for a code from the authenticator app once a secret is generated', async () => {
      await generateSecret();

      const banner = await loader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.verification.pendingRenewal);
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
      expect(await loader.getHarnessOrNull(TnInputHarness)).not.toBeNull();
    });

    it('completes setup when the code matches the secret', async () => {
      await generateSecret();

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      expect(await loader.getHarnessOrNull(TnInputHarness)).toBeNull();
      expect(await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Unset 2FA Secret' }))).toHaveLength(1);
    });

    it('removes the secret when the user cancels instead of confirming', async () => {
      await generateSecret();

      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.cancelBtn }))).click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: helptext2fa.verification.cancel.title,
        message: helptext2fa.verification.cancel.renewalMessage,
        buttonText: helptext2fa.verification.cancel.btn,
        cancelText: helptext2fa.verification.cancel.cancelBtn,
        hideCheckbox: true,
        buttonColor: 'warn',
      });
      expect(api.call).toHaveBeenCalledWith('user.unset_2fa_secret', ['dummy']);
      expect(await loader.getHarnessOrNull(TnInputHarness)).toBeNull();
    });

    it('resumes confirmation after a reload, so an unconfirmed secret is never left behind', async () => {
      await generateSecret();

      const reloaded = createComponent();
      const reloadedLoader = TestbedHarnessEnvironment.loader(reloaded.fixture);

      expect(await reloadedLoader.getHarnessOrNull(TnInputHarness)).not.toBeNull();
    });

    it('keys the stored flag to the account, so another user\'s flag is ignored', async () => {
      // Nothing clears this on logout, so on a shared workstation an origin-wide key
      // would drop the next user into a confirmation step for a secret that is not theirs.
      // Both shapes: the origin-wide key an unscoped build would read, and another
      // account's scoped one. A real PendingKind value, since an invalid one would be
      // rejected on its own and prove nothing about the key.
      storage.set('pending2FaVerification', 'renewal');
      storage.set('pending2FaVerification:someone-else', 'renewal');

      const nextUser = createComponent();
      const nextUserLoader = TestbedHarnessEnvironment.loader(nextUser.fixture);

      expect(await nextUserLoader.getHarnessOrNull(TnInputHarness)).toBeNull();
      expect(await nextUserLoader.getAllHarnesses(
        TnButtonHarness.with({ label: 'Renew 2FA Secret' }),
      )).toHaveLength(1);
    });

    it('drops the stored flag once the code is confirmed', async () => {
      await generateSecret();
      expect(storage.get('pending2FaVerification:dummy')).toBe('renewal');

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      expect(storage.has('pending2FaVerification:dummy')).toBe(false);
    });

    it('warns that cancelling a renewal turns 2FA off, not that it stays off', async () => {
      // The old secret is already invalidated by the time this step opens, so cancelling
      // is destructive here in a way it is not on a first-time setup.
      await generateSecret();
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.cancelBtn }))).click();

      const { message } = jest.mocked(spectator.inject(DialogService).confirm).mock.calls.at(-1)[0];
      expect(message).toBe(helptext2fa.verification.cancel.renewalMessage);
      expect(message).not.toContain('stay off');
    });

    it('uses the first-time wording when no secret existed before', async () => {
      user$.next({ pw_name: 'dummy', two_factor_config: { secret_configured: false } } as LoggedInUser);

      const firstTime = createComponent();
      const firstTimeLoader = TestbedHarnessEnvironment.loader(firstTime.fixture);

      await (await firstTimeLoader.getHarness(TnButtonHarness.with({ label: 'Configure 2FA Secret' }))).click();
      firstTime.detectChanges();

      const banner = await firstTimeLoader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.verification.pending);
      expect(storage.get('pending2FaVerification:dummy')).toBe('setup');
    });

    it('honours the appliance tolerance window instead of its own default', async () => {
      // Global config says window: 0, so only the current step counts. A code from the
      // adjacent step must be refused here, or the page would confirm a code login rejects.
      await generateSecret();

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(previousStepCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      const field = await loader.getHarness(TnFormFieldHarness);
      expect(await field.getErrorMessage()).toBe(helptext2fa.verification.invalid);
    });

    it('checks the code against the appliance clock, not the browser one', async () => {
      // The browser is a third clock with no part in the real exchange: the phone and the
      // appliance are NTP-synced, and login asks appliance-time-vs-secret. A workstation
      // 54s adrift must not reject the code the middleware would accept.
      await generateSecret();

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      expect(await loader.getHarnessOrNull(TnInputHarness)).toBeNull();
    });

    it('falls back to the browser clock when the appliance time cannot be read', async () => {
      jest.mocked(api.call).mockImplementation(((method: string) => {
        return method === 'system.info' ? throwError(() => new Error('down')) : of(undefined);
      }) as ApiService['call']);

      const offline = createComponent();
      const offlineLoader = TestbedHarnessEnvironment.loader(offline.fixture);

      await (await offlineLoader.getHarness(TnButtonHarness.with({ label: 'Renew 2FA Secret' }))).click();
      offline.detectChanges();

      // browserNow sits in the step before validCode's, so the browser-clock fallback
      // accepts that step's code — the behaviour before appliance time was consulted.
      const otpInput = await offlineLoader.getHarness(TnInputHarness);
      await otpInput.setValue(previousStepCode);
      await (await offlineLoader.getHarness(
        TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }),
      )).click();
      offline.detectChanges();

      expect(await offlineLoader.getHarnessOrNull(TnInputHarness)).toBeNull();
    });

    it('marks the secret unconfirmed even if the follow-up user refresh fails', async () => {
      // renew_2fa_secret arms the secret server-side. If the refresh behind it fails and
      // the flag were written after, the next load would present an armed, unscanned
      // secret as finished setup.
      jest.mocked(spectator.inject(AuthService).refreshUser)
        .mockReturnValueOnce(throwError(() => new Error('session dropped')));

      await generateSecret();

      expect(storage.get('pending2FaVerification:dummy')).toBe('renewal');

      const reloaded = createComponent();
      const reloadedLoader = TestbedHarnessEnvironment.loader(reloaded.fixture);
      expect(await reloadedLoader.getHarnessOrNull(TnInputHarness)).not.toBeNull();
    });

    it('keeps Cancel Setup working after a failed refresh left no current user', async () => {
      // refreshUser() pushes null onto user$ before re-fetching, so a failure leaves null
      // as the current value. Taking that null and filtering it would complete the stream
      // having done nothing, stranding the loading flag on with every button disabled.
      jest.mocked(spectator.inject(AuthService).refreshUser)
        .mockReturnValueOnce(throwError(() => new Error('session dropped')));
      await generateSecret();

      user$.next(null as unknown as LoggedInUser);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.cancelBtn }))).click();

      // Nothing can happen while there is no user...
      expect(api.call).not.toHaveBeenCalledWith('user.unset_2fa_secret', ['dummy']);

      // ...but the moment one is resolved again, the cancel goes through.
      user$.next(configuredUser);
      spectator.detectChanges();

      expect(api.call).toHaveBeenCalledWith('user.unset_2fa_secret', ['dummy']);
    });

    it('reports an unusable provisioning URI as a mismatched code, not a dead button', async () => {
      // A first-time setup whose renew failed leaves the step on screen with no secret
      // behind it. `new URL(null)` throws inside the subscribe, so Confirm Code would do
      // nothing at all — no message, no state change, just a console error.
      await generateSecret();
      twoFactorConfig$.next({ ...twoFactorConfig, provisioning_uri: null } as unknown as UserTwoFactorConfig);

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      const field = await loader.getHarness(TnFormFieldHarness);
      expect(await field.getErrorMessage()).toBe(helptext2fa.verification.invalid);
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
