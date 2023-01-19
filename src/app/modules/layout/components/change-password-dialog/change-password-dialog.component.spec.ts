import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockWebsocketService2 } from 'app/core/testing/classes/mock-websocket2.service';
import { mockCall, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { DialogService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';

describe('ChangePasswordDialogComponent', () => {
  let spectator: Spectator<ChangePasswordDialogComponent>;
  let loader: HarnessLoader;
  let websocket: WebSocketService2;
  const createComponent = createComponentFactory({
    component: ChangePasswordDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket2([
        mockCall('auth.check_user', true),
        mockCall('user.update'),
      ]),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService2);
  });

  it('checks current user password and shows an error if it is not correct', async () => {
    const websocketMock = spectator.inject(MockWebsocketService2);
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
    expect(websocket.call).toHaveBeenCalledWith('user.update', [1, { password: '123456' }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
