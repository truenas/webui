import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnBannerHarness, TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { LoginResult } from 'app/enums/login-result.enum';
import { LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SetAdminPasswordFormComponent,
} from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';

describe('SetAdminPasswordFormComponent', () => {
  let spectator: Spectator<SetAdminPasswordFormComponent>;
  let loader: HarnessLoader;
  const isLoading$ = new BehaviorSubject(false);
  const createComponent = createComponentFactory({
    component: SetAdminPasswordFormComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('user.setup_local_administrator'),
      ]),
      mockProvider(SigninStore, {
        // Kept live, like the real store, so the submit button's in-flight label can be asserted.
        setLoadingState: jest.fn((isLoading: boolean) => isLoading$.next(isLoading)),
        handleSuccessfulLogin: jest.fn(),
        isLoading$,
      }),
      mockProvider(AuthService, {
        login: jest.fn(() => of({
          loginResult: LoginResult.Success,
          loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
        })),
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    isLoading$.next(false);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function getField(name: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ name }));
  }

  it('shows a banner explaining the first-time setup', async () => {
    const banner = await loader.getHarness(
      TnBannerHarness.with({ textContains: /First-time setup/ }),
    );
    expect(await banner.getText()).toContain('No administrator account has been configured yet.');
  });

  it('shows truenas_admin in readonly Username field', async () => {
    const username = await getField('username');
    expect(await username.getValue()).toBe('truenas_admin');
    expect(await username.isReadonly()).toBe(true);
  });

  it('toggles password visibility via the suffix actions', async () => {
    const password = await getField('password');
    expect(await (await password.getSuffixIcon())!.getName()).toBe('mdi-eye-off');
    await password.clickSuffixAction();
    expect(await (await password.getSuffixIcon())!.getName()).toBe('mdi-eye');

    const password2 = await getField('password2');
    expect(await (await password2.getSuffixIcon())!.getName()).toBe('mdi-eye-off');
    await password2.clickSuffixAction();
    expect(await (await password2.getSuffixIcon())!.getName()).toBe('mdi-eye');
  });

  it('sets new admin password when form is submitted', async () => {
    await (await getField('password')).setValue('12345678');
    await (await getField('password2')).setValue('12345678');

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Sign In' }));
    await submitButton.click();

    const api = spectator.inject(ApiService);
    expect(api.call).toHaveBeenCalledWith('user.setup_local_administrator', ['truenas_admin', '12345678']);
    const authService = spectator.inject(AuthService);
    expect(authService.login).toHaveBeenCalledWith('truenas_admin', '12345678');

    const signinStore = spectator.inject(SigninStore);
    expect(signinStore.setLoadingState).toHaveBeenCalledWith(true);
    expect(signinStore.handleSuccessfulLogin).toHaveBeenCalled();
  });

  it('shows progress on the submit button while the setup is in flight', async () => {
    const login$ = new Subject<{ loginResult: LoginResult }>();
    jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(login$);

    await (await getField('password')).setValue('12345678');
    await (await getField('password2')).setValue('12345678');
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Sign In' }))).click();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(await loader.getHarness(TnButtonHarness.with({ label: 'Logging in...' }))).toBeTruthy();

    // A failure must hand the form back, rather than leave "Logging in..." over an idle form.
    login$.next({ loginResult: LoginResult.NoToken });
    login$.complete();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(await loader.getHarness(TnButtonHarness.with({ label: 'Sign In' }))).toBeTruthy();
  });

  it('shows error message when login fails', async () => {
    jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
      loginResult: LoginResult.NoToken,
      loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
    }));

    await (await getField('password')).setValue('12345678');
    await (await getField('password2')).setValue('12345678');

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Sign In' }));
    await submitButton.click();

    const snackbar = spectator.inject(SnackbarService);
    expect(snackbar.error).toHaveBeenCalledWith('Login error. Please try again.');
  });
});
