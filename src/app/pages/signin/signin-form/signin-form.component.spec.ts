import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { LoginResult } from 'app/enums/login-result.enum';
import { LoginExResponse, LoginExResponseType, LoginSuccessResponse } from 'app/interfaces/auth.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';

describe('SigninFormComponent', () => {
  let spectator: Spectator<SigninFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
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
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
        get: jest.fn((key: string) => of(key)),
        stream: jest.fn((key: string) => of(key)),
        currentLang: 'en',
      }),
      mockProvider(SigninStore, {
        setLoadingState: jest.fn(),
        handleSuccessfulLogin: jest.fn(),
        isLoading$: of(false),
        showSnackbar: jest.fn(),
        getLoginErrorMessage: jest.fn((result, isOtp) => {
          if (result === LoginResult.NoAccess) {
            return 'User is lacking permissions to access WebUI.';
          }
          return isOtp
            ? 'Incorrect or expired OTP. Please try again.'
            : 'Wrong username or password. Please try again.';
        }),
      }),
      mockProvider(AutofillMonitor, {
        monitor: jest.fn(() => of({ isAutofilled: true })),
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key) => key),
      }),
    ],
  });

  beforeEach(async () => {
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
    form = await loader.getHarness(IxFormHarness);
  });

  it('logs user in and calls handleSuccessfulLogin on success', async () => {
    await form.fillForm({
      Username: 'root',
      Password: '12345678',
    });

    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In' }));
    await loginButton.click();

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

      await form.fillForm({
        Username: 'test',
        Password: 'test',
      });
      const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In' }));
      await loginButton.click();

      expect(signinStore.setLoadingState).toHaveBeenCalledWith(false);
      expect(signinStore.getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.NoAccess);
      expect(signinStore.showSnackbar).toHaveBeenCalledWith('User is lacking permissions to access WebUI.');
    });

    it('handles wrong credentials login failure', async () => {
      const signinStore = spectator.inject(SigninStore);
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.NoToken,
        loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
      }));

      await form.fillForm({
        Username: 'test',
        Password: 'wrong',
      });
      const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In' }));
      await loginButton.click();

      expect(signinStore.setLoadingState).toHaveBeenCalledWith(false);
      expect(signinStore.getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.NoToken);
      expect(signinStore.showSnackbar).toHaveBeenCalledWith('Wrong username or password. Please try again.');
      expect(spectator.query('.error p')).toHaveText('Wrong username or password. Please try again.');
    });

    it('handles OTP required login result', async () => {
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.NoOtp,
        loginResponse: {
          response_type: LoginExResponseType.OtpRequired,
          username: 'testuser',
        } as LoginExResponse,
      }));

      await form.fillForm({
        Username: 'testuser',
        Password: 'testpass',
      });
      const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In' }));
      await loginButton.click();

      expect(spectator.component.form.controls.otp.enabled).toBe(true);
      expect(spectator.component.form.value.password).toBe('');
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

      await form.fillForm({
        Username: 'testuser',
        Password: 'testpass',
      });
      await (await loader.getHarness(MatButtonHarness.with({ text: 'Log In' }))).click();

      // Wait for the component to update and show OTP field
      spectator.detectChanges();

      // Get a fresh form harness since the form structure has changed
      form = await loader.getHarness(IxFormHarness);

      // Now test OTP failure
      jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
        loginResult: LoginResult.NoAccess,
        loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
      }));

      await form.fillForm({ 'Two-Factor Authentication Code': '123456' });
      await (await loader.getHarness(MatButtonHarness.with({ text: 'Proceed' }))).click();

      expect(signinStore.getLoginErrorMessage).toHaveBeenCalledWith(LoginResult.NoAccess, true);
      expect(spectator.component.form.value.otp).toBe('');
      expect(signinStore.showSnackbar).toHaveBeenCalledWith('User is lacking permissions to access WebUI.');
    });
  });
});
