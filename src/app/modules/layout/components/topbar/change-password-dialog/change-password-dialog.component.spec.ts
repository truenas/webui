import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChangePasswordDialogComponent } from 'app/modules/layout/components/topbar/change-password-dialog/change-password-dialog.component';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { WebSocketService } from 'app/services/ws.service';

describe('ChangePasswordDialogComponent', () => {
  let spectator: Spectator<ChangePasswordDialogComponent>;
  let loader: HarnessLoader;
  let websocket: WebSocketService;
  const createComponent = createComponentFactory({
    component: ChangePasswordDialogComponent,
    imports: [
      ReactiveFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('user.set_password'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(MatDialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService);
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

    expect(websocket.call).toHaveBeenCalledWith('user.set_password', [{
      old_password: 'correct',
      new_password: '123456',
      username: 'root',
    }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('shows error if any happened during password change request', async () => {
    const error = new Error('error');
    jest.spyOn(websocket, 'call').mockReturnValue(throwError(() => error));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Current Password': 'incorrect',
      'New Password': '123456',
      'Confirm Password': '123456',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(FormErrorHandlerService).handleWsFormError)
      .toHaveBeenCalledWith(error, expect.any(FormGroup));
  });
});
