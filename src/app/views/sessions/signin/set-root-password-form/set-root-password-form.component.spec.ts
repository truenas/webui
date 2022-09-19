import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemEnvironment } from 'app/enums/system-environment.enum';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { WebSocketService } from 'app/services';
import {
  SetRootPasswordFormComponent,
} from 'app/views/sessions/signin/set-root-password-form/set-root-password-form.component';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

describe('SetRootPasswordFormComponent', () => {
  let spectator: Spectator<SetRootPasswordFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SetRootPasswordFormComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('user.set_root_password'),
        mockCall('system.environment', SystemEnvironment.Default),
      ]),
      mockProvider(SigninStore, {
        setLoadingState: jest.fn(),
        handleSuccessfulLogin: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    jest.spyOn(spectator.inject(MockWebsocketService), 'login').mockReturnValue(of(null));
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const websocket = spectator.inject(WebSocketService);
    jest.spyOn(websocket, 'login').mockReturnValue(of(true));
  });

  it('sets new root password when form is submitted', async () => {
    await form.fillForm({
      Password: '12345678',
      'Reenter Password': '12345678',
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sign In' }));
    await submitButton.click();

    const websocket = spectator.inject(WebSocketService);
    expect(websocket.call).toHaveBeenCalledWith('user.set_root_password', ['12345678']);
    expect(websocket.login).toHaveBeenCalledWith('root', '12345678');

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

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('user.set_root_password', ['12345678', { instance_id: 'i-12345678' }]);
  });
});
