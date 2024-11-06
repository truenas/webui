import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChangePasswordDialogComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

describe('ChangePasswordDialogComponent', () => {
  let spectator: Spectator<ChangePasswordDialogComponent>;
  let loader: HarnessLoader;
  let websocket: WebSocketService;
  const createComponent = createComponentFactory({
    component: ChangePasswordDialogComponent,
    imports: [
      ReactiveFormsModule,
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

  it('does not show current password field for full admin', async () => {
    const authMock = spectator.inject(MockAuthService);
    authMock.setRoles([Role.FullAdmin]);

    const form = await loader.getHarness(IxFormHarness);
    expect(await form.getControl('Current Password')).toBeUndefined();
  });

  it('checks current password, updates to new password and closes the dialog when form is saved', async () => {
    const authMock = spectator.inject(MockAuthService);
    authMock.setRoles([Role.ReadonlyAdmin]);

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
    const authMock = spectator.inject(MockAuthService);
    authMock.setRoles([Role.ReadonlyAdmin]);

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
