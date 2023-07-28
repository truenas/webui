import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';

const loggedInUser = {
  pw_name: 'root',
  pw_uid: 0,
  pw_gid: 0,
  pw_gecos: 'root',
  pw_dir: '/root',
  pw_shell: '/usr/bin/zsh',
  id: 1,
};

describe('ChangePasswordDialogComponent', () => {
  let spectator: Spectator<ChangePasswordDialogComponent>;
  let loader: HarnessLoader;
  let websocket: WebSocketService;
  const createComponent = createComponentFactory({
    component: ChangePasswordDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('auth.check_user', true),
        mockCall('user.update'),
      ]),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      mockProvider(AuthService, {
        user$: of(loggedInUser),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService);
  });

  it('checks current user password and shows an error if it is not correct', async () => {
    const websocketMock = spectator.inject(MockWebsocketService);
    websocketMock.mockCallOnce('auth.check_user', false);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Current Password': 'incorrect',
      'New Password': '123456',
      'Confirm Password': '123456',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('auth.check_user', ['root', 'incorrect']);
    expect(websocket.call).not.toHaveBeenCalledWith('user.update', expect.anything);
  });

  it('checks current password, updates to new password and closes the dialog when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Current Password': 'correct',
      'New Password': '123456',
      'Confirm Password': '123456',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('auth.check_user', ['root', 'correct']);
    expect(websocket.call).toHaveBeenCalledWith('user.update', [loggedInUser.id, { password: '123456' }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
