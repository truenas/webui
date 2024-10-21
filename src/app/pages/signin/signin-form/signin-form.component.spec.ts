import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LoginResult } from 'app/enums/login-result.enum';
import { LoginExResponseType } from 'app/interfaces/auth.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { InsecureConnectionComponent } from 'app/pages/signin/insecure-connection/insecure-connection.component';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { AuthService } from 'app/services/auth/auth.service';

describe('SigninFormComponent', () => {
  let spectator: Spectator<SigninFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SigninFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(InsecureConnectionComponent),
    ],
    providers: [
      mockProvider(AuthService, {
        login: jest.fn(() => of(LoginResult.Success)),
      }),
      mockWebSocket([
        mockCall('auth.login_ex', { response_type: LoginExResponseType.Success }),
      ]),
      mockProvider(SigninStore, {
        setLoadingState: jest.fn(),
        handleSuccessfulLogin: jest.fn(),
        isLoading$: of(false),
      }),
      mockProvider(AutofillMonitor, {
        monitor: jest.fn(() => of({ isAutofilled: true })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        disabled: false,
      },
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
});
