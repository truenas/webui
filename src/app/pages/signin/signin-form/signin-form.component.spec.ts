import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { TnBannerHarness, TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { LoginResult } from 'app/enums/login-result.enum';
import { LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';

describe('SigninFormComponent', () => {
  let spectator: Spectator<SigninFormComponent>;
  let loader: HarnessLoader;
  const isLoading$ = new BehaviorSubject(false);
  const createComponent = createComponentFactory({
    component: SigninFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(AuthService, {
        login: jest.fn(() => of({
          loginResult: LoginResult.Success,
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(SigninStore, {
        // Kept live, like the real store, so the submit button's in-flight label can be asserted.
        setLoadingState: jest.fn((isLoading: boolean) => isLoading$.next(isLoading)),
        handleSuccessfulLogin: jest.fn(),
        isLoading$,
        getLoginErrorMessage: jest.fn((result, isOtp) => {
          if (result === LoginResult.NoAccess) {
            return 'User is lacking permissions to access WebUI.';
          }
          return isOtp
            ? 'Incorrect or expired OTP. Enter your password again to get a new code prompt.'
            : 'Wrong username or password. Please try again.';
        }),
      }),
    ],
  });

  beforeEach(() => {
    isLoading$.next(false);
    spectator = createComponent({
      props: {
        disabled: false,
      },
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: jest.fn((key: string) => key),
            get: jest.fn((key: string) => of(key)),
            stream: jest.fn((key: string) => of(key)),
            onLangChange: of({ lang: 'en' }),
            onTranslationChange: of({}),
            onDefaultLangChange: of({}),
            currentLang: 'en',
            defaultLang: 'en',
          },
        },
      ],
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });


  async function fillField(name: string, value: string): Promise<void> {
    const input = await loader.getHarness(TnInputHarness.with({ name }));
    await input.setValue(value);
  }

  it('shows insecure-connection warning banner when not on https', async () => {
    const banner = await loader.getHarness(
      TnBannerHarness.with({ textContains: /Connection is insecure/ }),
    );
    expect(await banner.getText()).toContain('You are using an insecure connection. Switch to HTTPS for secure access.');
  });

  it('toggles password visibility via the suffix action', async () => {
    const password = await loader.getHarness(TnInputHarness.with({ name: 'password' }));
    expect(await (await password.getSuffixIcon())!.getName()).toBe('mdi-eye-off');

    await password.clickSuffixAction();

    expect(await (await password.getSuffixIcon())!.getName()).toBe('mdi-eye');
  });

  it('logs user in and calls handleSuccessfulLogin on success', async () => {
    await fillField('username', 'root');
    await fillField('password', '12345678');

    const loginButton = await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }));
    await loginButton.click();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const signinStore = spectator.inject(SigninStore);
    expect(signinStore.setLoadingState).toHaveBeenCalledWith(true);
    expect(spectator.inject(AuthService).login).toHaveBeenCalledWith('root', '12345678');
    expect(signinStore.handleSuccessfulLogin).toHaveBeenCalled();
  });

  it('shows progress on the submit button while a login is in flight', async () => {
    const login$ = new Subject<{ loginResult: LoginResult; loginResponse: LoginExResponse }>();
    jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(login$);

    await fillField('username', 'root');
    await fillField('password', '12345678');
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }))).click();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(await loader.getHarness(TnButtonHarness.with({ label: 'Logging in...' }))).toBeTruthy();

    // A failure must hand the form back, rather than leave "Logging in..." over an idle form.
    login$.next({
      loginResult: LoginResult.NoAccess,
      loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
    });
    login$.complete();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }))).toBeTruthy();
  });

  describe('error handling', () => {
    it('handles NoAccess login failure', async () => {
      const signinStore = spectator.inject(SigninStore);
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.NoAccess,
        loginResponse: {
          response_type: LoginExResponseType.Success,
          user_info: { privilege: { webui_access: false } },
          authenticator: null,
        } as LoginExResponse,
      }));

      await fillField('username', 'test');
      await fillField('password', 'test');
      const loginButton = await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }));
      await loginButton.click();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(signinStore.setLoadingState).toHaveBeenCalledWith(false);
      expect(signinStore.getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.NoAccess);
      expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith('User is lacking permissions to access WebUI.');
    });

    it('handles wrong credentials login failure', async () => {
      const signinStore = spectator.inject(SigninStore);
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.NoToken,
        loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
      }));

      await fillField('username', 'test');
      await fillField('password', 'wrong');
      const loginButton = await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }));
      await loginButton.click();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(signinStore.setLoadingState).toHaveBeenCalledWith(false);
      expect(signinStore.getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.NoToken);
      expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith('Wrong username or password. Please try again.');

      spectator.detectChanges();
      expect(spectator.query('.error p')).toHaveText('Wrong username or password. Please try again.');
    });

    it('handles Denied login failure', async () => {
      const signinStore = spectator.inject(SigninStore);
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.Denied,
        loginResponse: {
          response_type: LoginExResponseType.Denied,
        } as LoginExResponse,
      }));

      (signinStore.getLoginErrorMessage as jest.Mock).mockReturnValueOnce(
        'Login denied. Please ensure proper roles have been granted to the user.',
      );

      await fillField('username', 'test');
      await fillField('password', 'test');
      const loginButton = await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }));
      await loginButton.click();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(signinStore.setLoadingState).toHaveBeenCalledWith(false);
      expect(signinStore.getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.Denied);
      expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith(
        'Login denied. Please ensure proper roles have been granted to the user.',
      );
    });

    it('handles OTP required login result', async () => {
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.NoOtp,
        loginResponse: {
          response_type: LoginExResponseType.OtpRequired,
          username: 'testuser',
        } as LoginExResponse,
      }));

      await fillField('username', 'testuser');
      await fillField('password', 'testpass');
      const loginButton = await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }));
      await loginButton.click();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.otp.enabled).toBe(true);
      expect(spectator.component.form.value.password).toBe('');

      const otpBanner = await loader.getHarness(
        TnBannerHarness.with({ textContains: /Enter one-time password/ }),
      );
      expect(await otpBanner.getText()).toContain('2FA has been configured for this account. Enter the OTP to continue.');
    });

    describe('after a failed OTP', () => {
      const wrongCodeMessage = 'Incorrect or expired OTP. Enter your password again to get a new code prompt.';

      async function reachOtpStep(): Promise<void> {
        jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
          loginResult: LoginResult.NoOtp,
          loginResponse: {
            response_type: LoginExResponseType.OtpRequired,
            username: 'testuser',
          } as LoginExResponse,
        }));

        await fillField('username', 'testuser');
        await fillField('password', 'testpass');
        await (await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }))).click();
        spectator.detectChanges();
        await spectator.fixture.whenStable();
      }

      async function submitOtp(loginResult: LoginResult): Promise<void> {
        jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
          loginResult,
          loginResponse: { response_type: LoginExResponseType.AuthErr } as LoginExResponse,
        }));

        await fillField('otp', '123456');
        await (await loader.getHarness(TnButtonHarness.with({ label: 'Proceed' }))).click();
        spectator.detectChanges();
        await spectator.fixture.whenStable();
      }

      it('returns to the password step and says why, because middleware ended the code step', async () => {
        await reachOtpStep();
        // On the code step before the failure, so its absence below is the failure's doing.
        expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'username' }))).toBeNull();

        await submitOtp(LoginResult.NoToken);

        expect(spectator.inject(SigninStore).getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.NoToken, true);
        expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith(wrongCodeMessage);
        expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'otp' }))).toBeNull();
        expect(await loader.getHarness(TnButtonHarness.with({ label: 'Log In' }))).toBeTruthy();
        expect(spectator.query('.error p')).toHaveText(wrongCodeMessage);
        expect(spectator.component.form.getRawValue()).toEqual({ username: 'testuser', password: '', otp: '' });
      });

      it('signs in with the password and then the next code', async () => {
        await reachOtpStep();
        await submitOtp(LoginResult.NoToken);

        const login = jest.spyOn(spectator.inject(AuthService), 'login');
        await reachOtpStep();
        expect(login).toHaveBeenLastCalledWith('testuser', 'testpass');

        await submitOtp(LoginResult.Success);
        // The code step emptied the password field; a code alone continues the login.
        expect(login).toHaveBeenLastCalledWith('testuser', '', '123456');
        expect(spectator.inject(SigninStore).handleSuccessfulLogin).toHaveBeenCalled();
      });

      it('returns to the password step for a refusal other than the code, too', async () => {
        await reachOtpStep();

        await submitOtp(LoginResult.NoAccess);

        expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith('User is lacking permissions to access WebUI.');
        expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'otp' }))).toBeNull();
        expect(spectator.component.form.value.otp).toBe('');
      });
    });
  });
});
