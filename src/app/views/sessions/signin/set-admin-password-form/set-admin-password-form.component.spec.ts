import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemEnvironment } from 'app/enums/system-environment.enum';
import { IxRadioGroupHarness } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';
import {
  SetAdminPasswordFormComponent,
} from 'app/views/sessions/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

describe('SetAdminPasswordFormComponent', () => {
  let spectator: Spectator<SetAdminPasswordFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SetAdminPasswordFormComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('user.setup_local_administrator'),
        mockCall('system.environment', SystemEnvironment.Default),
      ]),
      mockProvider(SigninStore, {
        setLoadingState: jest.fn(),
        handleSuccessfulLogin: jest.fn(),
      }),
      mockProvider(AuthService, {
        login: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    jest.spyOn(spectator.inject(AuthService), 'login').mockReturnValue(of(null));
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const authService = spectator.inject(AuthService);
    jest.spyOn(authService, 'login').mockReturnValue(of(true));
  });

  it('sets new root password when form is submitted', async () => {
    const usernameRadio = await loader.getHarness(IxRadioGroupHarness);
    await usernameRadio.setValue('Root user (not recommended)');

    await form.fillForm({
      Password: '12345678',
      'Reenter Password': '12345678',
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }));
    await submitButton.click();

    const websocket = spectator.inject(WebSocketService);
    const authService = spectator.inject(AuthService);
    expect(websocket.call).toHaveBeenCalledWith('user.setup_local_administrator', ['root', '12345678']);
    expect(authService.login).toHaveBeenCalledWith('root', '12345678');

    const signinStore = spectator.inject(SigninStore);
    expect(signinStore.setLoadingState).toHaveBeenCalledWith(true);
    expect(signinStore.handleSuccessfulLogin).toHaveBeenCalled();
  });

  it('sets new admin password when form is submitted', async () => {
    await form.fillForm({
      Password: '12345678',
      'Reenter Password': '12345678',
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }));
    await submitButton.click();

    const websocket = spectator.inject(WebSocketService);
    expect(websocket.call).toHaveBeenCalledWith('user.setup_local_administrator', ['admin', '12345678']);
    const authService = spectator.inject(AuthService);
    expect(authService.login).toHaveBeenCalledWith('admin', '12345678');

    const signinStore = spectator.inject(SigninStore);
    expect(signinStore.setLoadingState).toHaveBeenCalledWith(true);
    expect(signinStore.handleSuccessfulLogin).toHaveBeenCalled();
  });

  it('checks environment status and shows EC2 Instance ID when environment is EC2', async () => {
    const websocket = spectator.inject(MockWebsocketService);
    websocket.mockCall('system.environment', SystemEnvironment.Ec2);

    spectator.component.ngOnInit();

    await form.fillForm({
      Password: '12345678',
      'Reenter Password': '12345678',
      'EC2 Instance ID': 'i-12345678',
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }));
    await submitButton.click();

    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('user.setup_local_administrator', ['admin', '12345678', { instance_id: 'i-12345678' }]);
  });
});
