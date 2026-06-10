import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { TnBannerHarness, TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { LoginResult } from 'app/enums/login-result.enum';
import { LoginExResponse, LoginExResponseType, LoginSuccessResponse } from 'app/interfaces/auth.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';

describe('SigninFormComponent', () => {
  let spectator: Spectator<SigninFormComponent>;
  let loader: HarnessLoader;
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
      mockApi([
        mockCall('auth.login_ex', { response_type: LoginExResponseType.Success } as LoginSuccessResponse),
      ]),
      mockProvider(SnackbarService),
      mockProvider(SigninStore, {
        setLoadingState: jest.fn(),
        handleSuccessfulLogin: jest.fn(),
        isLoading$: of(false),
        getLoginErrorMessage: jest.fn((result, isOtp) => {
          if (result === LoginResult.NoAccess) {
            return 'User is lacking permissions to access WebUI.';
          }
          return isOtp
            ? 'Incorrect or expired OTP. Please try again.'
            : 'Wrong username or password. Please try again.';
        }),
      }),
    ],
  });

  beforeEach(() => {
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

    it('handles failed OTP login', async () => {
      const signinStore = spectator.inject(SigninStore);

      // First set up OTP field
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

      // Now test OTP failure
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.NoAccess,
        loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
      }));

      await fillField('otp', '123456');
      await (await loader.getHarness(TnButtonHarness.with({ label: 'Proceed' }))).click();

      expect(signinStore.getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.NoAccess, true);
      expect(spectator.component.form.value.otp).toBe('');
      expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith('User is lacking permissions to access WebUI.');
    });
  });
});
