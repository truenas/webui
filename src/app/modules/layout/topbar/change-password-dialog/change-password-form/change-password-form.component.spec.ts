import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChangePasswordDialog } from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';

describe('ChangePasswordDialogComponent', () => {
  let spectator: Spectator<ChangePasswordDialog>;
  let loader: HarnessLoader;
  let api: ApiService;
  
  const createComponent = createComponentFactory({
    component: ChangePasswordDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('user.set_password'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(MatDialogRef),
      mockProvider(LoaderService, {
        withLoader: () => (source$: any) => source$,
      }),
      mockProvider(SnackbarService),
    ],
  });

  it('does not show current password field for full admin', async () => {
    spectator = createComponent({
      providers: [
        mockAuth(),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    
    // Set up the auth mock to return true for FullAdmin
    const authMock = spectator.inject(MockAuthService);
    authMock.hasRole.mockReturnValue(of(true));
    
    spectator.detectChanges();

    const form = await loader.getHarness(IxFormHarness);
    expect(await form.getControl('Current Password')).toBeUndefined();
  });

  it('checks current password, updates to new password and closes the dialog when form is saved', async () => {
    spectator = createComponent({
      providers: [
        mockAuth(),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    
    // Set up the auth mock to return false for FullAdmin (i.e., not a full admin)
    const authMock = spectator.inject(MockAuthService);
    authMock.hasRole.mockReturnValue(of(false));
    
    spectator.detectChanges();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Current Password': 'correct',
      'New Password': '123456',
      'Confirm Password': '123456',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Change Password' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('user.set_password', [{
      old_password: 'correct',
      new_password: '123456',
      username: 'root',
    }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('shows error if any happened during password change request', async () => {
    spectator = createComponent({
      providers: [
        mockAuth(),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    
    // Set up the auth mock to return false for FullAdmin (i.e., not a full admin)
    const authMock = spectator.inject(MockAuthService);
    authMock.hasRole.mockReturnValue(of(false));
    
    spectator.detectChanges();

    const error = new Error('error');
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => error));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Current Password': 'incorrect',
      'New Password': '123456',
      'Confirm Password': '123456',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Change Password' }));
    await saveButton.click();

    expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
      .toHaveBeenCalledWith(error, expect.any(FormGroup));
  });
});
