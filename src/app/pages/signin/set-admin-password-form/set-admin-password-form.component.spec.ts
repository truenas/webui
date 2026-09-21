import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { LoginResult } from 'app/enums/login-result.enum';
import { LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SetAdminPasswordFormComponent,
} from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';

describe('SetAdminPasswordFormComponent', () => {
  let spectator: Spectator<SetAdminPasswordFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
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

  beforeEach(async () => {
    isLoading$.next(false);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows truenas_admin in readonly Username field', async () => {
    const username = await form.getControl('Username') as IxInputHarness;

    expect(await username.getValue()).toBe('truenas_admin');
    expect(await username.isReadonly()).toBe(true);
  });

  it('sets new admin password when form is submitted', async () => {
    await form.fillForm({
      Password: '12345678',
      'Reenter Password': '12345678',
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }));
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

    await form.fillForm({
      Password: '12345678',
      'Reenter Password': '12345678',
    });
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }))).click();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(await loader.getHarness(MatButtonHarness.with({ text: 'Logging in...' }))).toBeTruthy();

    // A failure must hand the form back, rather than leave "Logging in..." over an idle form.
    login$.next({ loginResult: LoginResult.NoToken });
    login$.complete();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }))).toBeTruthy();
  });

  it('shows error message when login fails', async () => {
    jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of({
      loginResult: LoginResult.NoToken,
      loginResponse: { response_type: LoginExResponseType.Success } as LoginExResponse,
    }));

    await form.fillForm({
      Password: '12345678',
      'Reenter Password': '12345678',
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }));
    await submitButton.click();

    const snackbar = spectator.inject(SnackbarService);
    expect(snackbar.error).toHaveBeenCalledWith('Login error. Please try again.');
  });
});
