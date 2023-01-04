import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { WebSocketService } from 'app/services';
import { SigninFormComponent } from 'app/views/sessions/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

describe('SigninFormComponent', () => {
  let spectator: Spectator<SigninFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SigninFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket2([
        mockCall('auth.login', true),
      ]),
      mockWebsocket([
        mockCall('auth.two_factor_auth', false),
      ]),
      mockProvider(SigninStore, {
        setLoadingState: jest.fn(),
        handleSuccessfulLogin: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    const websocketMock = spectator.inject(WebSocketService);
    jest.spyOn(websocketMock, 'login').mockReturnValue(of(true));

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
    expect(spectator.inject(WebSocketService).login).toHaveBeenCalledWith('root', '12345678');
    expect(signinStore.handleSuccessfulLogin).toHaveBeenCalled();
  });

  it('logs user in with OTP code when two factor auth is set up', async () => {
    const websocketMock = spectator.inject(MockWebsocketService);
    websocketMock.mockCall('auth.two_factor_auth', true);
    spectator.component.ngOnInit();

    await form.fillForm({
      Username: 'root',
      Password: '12345678',
      'Two-Factor Authentication Code': '212484',
    });

    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In' }));
    await loginButton.click();

    expect(spectator.inject(WebSocketService).login).toHaveBeenCalledWith('root', '12345678', '212484');
    expect(spectator.inject(SigninStore).handleSuccessfulLogin).toHaveBeenCalled();
  });
});
