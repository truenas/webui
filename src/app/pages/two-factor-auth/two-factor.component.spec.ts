import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnBannerComponent, TnBannerHarness, TnButtonComponent, TnButtonHarness, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { MockComponent, ngMocks } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective } from 'ng-qrcode';
import { BehaviorSubject, EMPTY, NEVER, Subject, of, throwError } from 'rxjs';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
        if (method === 'system.info') {
          return throwError(() => new Error('down'));
        }
        // auth.sessions has to stay list-shaped: loadTwoFactorConfigs calls .find() on it
        // and the subscribe has no error handler, so undefined would surface as unhandled
        // RxJS noise rather than a failure.
        return method === 'auth.sessions' ? of([]) : of(undefined);
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

    it('says the secret could not be read rather than blaming the code or the clock', async () => {
      // A first-time setup whose renew failed leaves the step on screen with no secret
      // behind it. `new URL(null)` threw inside the subscribe, so Confirm Code did
      // nothing at all — and the generic message would send the user to re-scan a QR
      // code that is not on screen.
      await generateSecret();
      twoFactorConfig$.next({ ...twoFactorConfig, provisioning_uri: null });

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      const field = await loader.getHarness(TnFormFieldHarness);
      expect(await field.getErrorMessage()).toBe(helptext2fa.verification.unreadableSecret);
    });

    it('keeps Configure reachable when a renew failed before minting a secret', async () => {
      // pendingVerification() is true but no secret exists, so the reason for hiding the
      // secret-management buttons does not apply — and hiding them would leave Cancel
      // Setup as the only control on the page.
      user$.next({ pw_name: 'dummy', two_factor_config: { secret_configured: false } } as LoggedInUser);
      jest.mocked(api.call).mockImplementation(((method: string) => {
        if (method === 'user.renew_2fa_secret') {
          return throwError(() => new Error('nope'));
        }
        return method === 'auth.sessions' ? of([]) : of(undefined);
      }) as ApiService['call']);

      const failed = createComponent();
      const failedLoader = TestbedHarnessEnvironment.loader(failed.fixture);

      await (await failedLoader.getHarness(TnButtonHarness.with({ label: 'Configure 2FA Secret' }))).click();
      failed.detectChanges();

      expect(await failedLoader.getAllHarnesses(
        TnButtonHarness.with({ label: 'Configure 2FA Secret' }),
      )).toHaveLength(1);

      const banner = await failedLoader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.verification.pendingUnknown);
    });

    it('keeps Skip Setup reachable in the dialog when a first-time renew failed', async () => {
      // The first-login dialog is opened with disableClose, and Skip touches no secret.
      // A renew that fails leaves the page pending with nothing behind it, so hiding Skip
      // there would leave Cancel Setup as the only exit from a dialog that cannot be closed.
      user$.next({ pw_name: 'dummy', two_factor_config: { secret_configured: false } } as LoggedInUser);
      jest.mocked(api.call).mockImplementation(((method: string) => {
        if (method === 'user.renew_2fa_secret') {
          return throwError(() => new Error('nope'));
        }
        return method === 'auth.sessions' ? of([]) : of(undefined);
      }) as ApiService['call']);

      const dialog = createComponent({ props: { isSetupDialog: true } });
      const dialogLoader = TestbedHarnessEnvironment.loader(dialog.fixture);

      await (await dialogLoader.getHarness(TnButtonHarness.with({ label: 'Configure 2FA Secret' }))).click();
      dialog.detectChanges();

      expect(await dialogLoader.getAllHarnesses(TnButtonHarness.with({ label: 'Skip Setup' }))).toHaveLength(1);
    });

    it('confirms against the secret the account holds now, not the cached one', async () => {
      // A renew whose reply was lost can rotate the secret without this page hearing
      // about it. Confirming against the superseded secret would clear the marker and
      // report success for a secret the account no longer has — the lockout, with a
      // green message in front of it.
      await generateSecret();

      // The server has moved on to a different secret; the page still caches the old one.
      jest.mocked(spectator.inject(AuthService).refreshUser).mockImplementationOnce(() => {
        twoFactorConfig$.next({
          ...twoFactorConfig,
          provisioning_uri: 'somepath://here/TrueNAS:first-test?secret=MZXW6YTBMZXW6YTBMZXW6YTBMZXW6YTB',
        });
        return of(undefined);
      });

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      const field = await loader.getHarness(TnFormFieldHarness);
      expect(await field.getErrorMessage()).toBe(helptext2fa.verification.invalid);
      expect(storage.get('pending2FaVerification:dummy')).toBe('renewal');
    });

    it('says so when the account cannot be re-read, instead of confirming blind', async () => {
      await generateSecret();
      jest.mocked(spectator.inject(AuthService).refreshUser)
        .mockReturnValueOnce(throwError(() => new Error('offline')));

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await loader.getHarness(TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }))).click();
      spectator.detectChanges();

      const field = await loader.getHarness(TnFormFieldHarness);
      expect(await field.getErrorMessage()).toBe(helptext2fa.verification.checkFailed);
      expect(storage.get('pending2FaVerification:dummy')).toBe('renewal');
    });

    // The component instance rather than a harness: while the load is in flight it holds
    // a timeout timer, which keeps the Angular zone unstable, and a harness would wait it
    // out. Reading the rendered component's inputs needs no test-id locator.
    function renewButtonOf(fixtureHost: Spectator<TwoFactorComponent>): TnButtonComponent | undefined {
      return fixtureHost.queryAll(TnButtonComponent).find((button) => button.label().endsWith('2FA Secret'));
    }

    it('holds the secret buttons until the page knows what it is looking at', () => {
      // A click landing before the load resolves would be rolled back by the snapshot
      // that reply carries.
      const systemInfo$ = new Subject<SystemInfo>();
      jest.mocked(api.call).mockImplementation(((method: string) => {
        if (method === 'system.info') {
          return systemInfo$;
        }
        return method === 'auth.sessions' ? of([]) : of(undefined);
      }) as ApiService['call']);

      const loading = createComponent();

      expect(renewButtonOf(loading)?.disabled()).toBe(true);

      systemInfo$.next({ datetime: { $date: applianceNow } } as SystemInfo);
      systemInfo$.complete();
      loading.detectChanges();

      expect(renewButtonOf(loading)?.disabled()).toBe(false);
    });

    it('gives the load a terminal outcome when a source never settles at all', fakeAsync(() => {
      // defaultIfEmpty only fires on completion, and getGlobalTwoFactorConfig switchMaps
      // over a BehaviorSubject that never completes — so an inner call that ends without
      // a result hangs the load rather than emptying it. Without the timeout the card
      // stays inert forever, with every secret button disabled and no error on screen.
      jest.mocked(spectator.inject(AuthService).getGlobalTwoFactorConfig).mockReturnValueOnce(NEVER);

      const stuck = createComponent();
      expect(renewButtonOf(stuck)?.disabled()).toBe(true);

      tick(30_000);
      stuck.detectChanges();

      expect(renewButtonOf(stuck)?.disabled()).toBe(false);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    }));

    it('lets the user retry the same code after a failed check', async () => {
      // checkFailed and unreadableSecret are set by hand and both say "try again"; if they
      // are left on the control the next submit is swallowed by the validity guard.
      await generateSecret();
      jest.mocked(spectator.inject(AuthService).refreshUser)
        .mockReturnValueOnce(throwError(() => new Error('offline')));

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      const confirmBtn = await loader.getHarness(
        TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }),
      );
      await confirmBtn.click();
      spectator.detectChanges();

      const field = await loader.getHarness(TnFormFieldHarness);
      expect(await field.getErrorMessage()).toBe(helptext2fa.verification.checkFailed);

      // Connection is back; the same code, unedited, must now be accepted.
      await confirmBtn.click();
      spectator.detectChanges();

      expect(await loader.getHarnessOrNull(TnInputHarness)).toBeNull();
    });

    it('applies the account state it re-read when confirming', async () => {
      // A disconnect spanning both the renew and its retry leaves the page believing no
      // secret exists. The confirming re-read knows better, and dropping it would leave
      // the card offering Configure right after saying 2FA was confirmed.
      user$.next({ pw_name: 'dummy', two_factor_config: { secret_configured: false } } as LoggedInUser);
      jest.mocked(api.call).mockImplementation(((method: string) => {
        if (method === 'user.renew_2fa_secret') {
          return throwError(() => new Error('offline'));
        }
        if (method === 'system.info') {
          return of({ datetime: { $date: applianceNow } } as SystemInfo);
        }
        return method === 'auth.sessions' ? of([]) : of(undefined);
      }) as ApiService['call']);
      jest.mocked(spectator.inject(AuthService).refreshUser)
        .mockReturnValueOnce(throwError(() => new Error('offline')));

      const stranded = createComponent();
      const strandedLoader = TestbedHarnessEnvironment.loader(stranded.fixture);
      await (await strandedLoader.getHarness(TnButtonHarness.with({ label: 'Configure 2FA Secret' }))).click();
      stranded.detectChanges();

      // Connectivity is back and the secret was in fact armed all along.
      const otpInput = await strandedLoader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      await (await strandedLoader.getHarness(
        TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }),
      )).click();
      stranded.detectChanges();

      expect(await strandedLoader.getAllHarnesses(
        TnButtonHarness.with({ label: 'Unset 2FA Secret' }),
      )).toHaveLength(1);
      expect(await strandedLoader.getAllHarnesses(
        TnButtonHarness.with({ label: 'Configure 2FA Secret' }),
      )).toHaveLength(0);
    });

    it('does not leave the page inert when a call completes without emitting', async () => {
      // A clean websocket reconnect completes the response stream, so an in-flight call
      // ends silently rather than erroring. isDataLoading disables every secret button,
      // so a stuck flag means a page nobody can use.
      jest.mocked(api.call).mockImplementation(((method: string) => {
        if (method === 'system.info') {
          return EMPTY;
        }
        return method === 'auth.sessions' ? of([]) : of(undefined);
      }) as ApiService['call']);

      const stalled = createComponent();
      const stalledLoader = TestbedHarnessEnvironment.loader(stalled.fixture);

      const renewBtn = await stalledLoader.getHarness(
        TnButtonHarness.with({ label: 'Renew 2FA Secret' }),
      );
      expect(await renewBtn.isDisabled()).toBe(false);
    });

    it('says the settings could not be read rather than rendering defaults', async () => {
      // Silently completing the user read would otherwise leave the card stating that 2FA
      // is off on a system where it is on, with no error anywhere on screen.
      jest.mocked(spectator.inject(AuthService).getGlobalTwoFactorConfig).mockReturnValueOnce(EMPTY);

      const stalled = createComponent();
      const stalledLoader = TestbedHarnessEnvironment.loader(stalled.fixture);

      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
      const banner = await stalledLoader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.loadFailed);
    });

    it('releases the form flag when the confirming read completes without emitting', async () => {
      await generateSecret();
      jest.mocked(spectator.inject(AuthService).refreshUser).mockReturnValueOnce(EMPTY);

      const otpInput = await loader.getHarness(TnInputHarness);
      await otpInput.setValue(validCode);
      const confirmBtn = await loader.getHarness(
        TnButtonHarness.with({ label: helptext2fa.verification.verifyBtn }),
      );
      await confirmBtn.click();
      spectator.detectChanges();

      // Confirm Code and Cancel Setup are the only controls rendered in this state.
      expect(await confirmBtn.isDisabled()).toBe(false);
      expect(await (await loader.getHarness(
        TnButtonHarness.with({ label: helptext2fa.verification.cancelBtn }),
      )).isDisabled()).toBe(false);
    });

    it('surfaces a load failure instead of disabling the page silently', async () => {
      jest.mocked(spectator.inject(AuthService).getGlobalTwoFactorConfig)
        .mockReturnValueOnce(throwError(() => new Error('down')));

      const failed = createComponent();
      const failedLoader = TestbedHarnessEnvironment.loader(failed.fixture);

      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
      const configureBtn = await failedLoader.getHarness(
        TnButtonHarness.with({ label: 'Configure 2FA Secret' }),
      );
      expect(await configureBtn.isDisabled()).toBe(false);
    });

    it('stops saying the settings could not be read once a later call has read them', async () => {
      // The load is not the page's last chance to learn the account state. Left set, the
      // failure banner shadows every later one — including the copy that explains what the
      // code field is for and what Cancel Setup undoes.
      jest.mocked(spectator.inject(AuthService).getGlobalTwoFactorConfig)
        .mockReturnValueOnce(throwError(() => new Error('down')));

      const recovered = createComponent();
      const recoveredLoader = TestbedHarnessEnvironment.loader(recovered.fixture);

      expect(await (await recoveredLoader.getHarness(TnBannerHarness)).getText())
        .toContain(helptext2fa.loadFailed);

      await (await recoveredLoader.getHarness(TnButtonHarness.with({ label: 'Configure 2FA Secret' }))).click();
      recovered.detectChanges();

      const banner = await recoveredLoader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.verification.pendingRenewal);
      expect(await banner.getText()).not.toContain(helptext2fa.loadFailed);
    });

    it('keeps the globally-disabled caveat while a secret waits to be confirmed', async () => {
      // The pending copy says the secret is active, which is only true once an admin turns
      // 2FA on — and the paragraph that normally carries that caveat is gated on the same
      // flag, so the banner is the only place left to say it.
      await generateSecret();

      const banner = await loader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.verification.pendingRenewal);
      expect(await banner.getText()).toContain(helptext2fa.verification.notActiveGlobally);
    });

    it('drops the caveat once 2FA is enabled system-wide', async () => {
      jest.mocked(spectator.inject(AuthService).getGlobalTwoFactorConfig)
        .mockReturnValueOnce(of({ enabled: true, window: 0 } as GlobalTwoFactorConfig));

      const enabled = createComponent();
      const enabledLoader = TestbedHarnessEnvironment.loader(enabled.fixture);
      await (await enabledLoader.getHarness(TnButtonHarness.with({ label: 'Renew 2FA Secret' }))).click();
      enabled.detectChanges();

      const banner = await enabledLoader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain(helptext2fa.verification.pendingRenewal);
      expect(await banner.getText()).not.toContain(helptext2fa.verification.notActiveGlobally);
    });

    it('assumes a secret may exist while the page is blind, and warns accordingly', async () => {
      // After a failed load `userTwoFactorAuthConfigured()` is a default, not a fact. If a
      // real renewal is labelled a first-time setup, Cancel Setup says 2FA will "stay off"
      // instead of saying the previous secret is already gone — the one sentence written
      // to tell the user what they just lost.
      jest.mocked(spectator.inject(AuthService).getGlobalTwoFactorConfig)
        .mockReturnValueOnce(throwError(() => new Error('down')));

      const blind = createComponent();
      const blindLoader = TestbedHarnessEnvironment.loader(blind.fixture);
      const dialog = jest.mocked(spectator.inject(DialogService).confirm);
      dialog.mockClear();

      await (await blindLoader.getHarness(TnButtonHarness.with({ label: 'Configure 2FA Secret' }))).click();
      blind.detectChanges();

      // The renew warning is not skipped either.
      expect(dialog.mock.calls[0][0]).toMatchObject({ title: helptext2fa.renewSecret.title });

      await (await blindLoader.getHarness(
        TnButtonHarness.with({ label: helptext2fa.verification.cancelBtn }),
      )).click();

      expect(dialog.mock.calls.at(-1)[0]).toMatchObject({
        message: helptext2fa.verification.cancel.renewalMessage,
      });
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
