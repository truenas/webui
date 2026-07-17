import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ChangePasswordDialog } from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';

describe('ChangePasswordFormComponent (via ChangePasswordDialog)', () => {
  let spectator: Spectator<ChangePasswordDialog>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasInput = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;

  const createComponent = createComponentFactory({
    component: ChangePasswordDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('user.set_password'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogRef),
      mockProvider(LoaderService, {
        withLoader: () => <T>(source$: T) => source$,
      }),
      mockProvider(SnackbarService),
    ],
  });

  it('does not show current password field for full admin', async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);

    // Ensure hasRole returns true when called with Role.FullAdmin
    const authService = spectator.inject(MockAuthService);
    (authService.hasRole as jest.Mock).mockImplementation((role: Role | Role[]) => {
      return of(role === Role.FullAdmin || (Array.isArray(role) && role.includes(Role.FullAdmin)));
    });

    spectator.detectChanges();

    expect(await hasInput('old_password')).toBe(false);
  });

  it('checks current password, updates to new password and closes the dialog when form is saved', async () => {
    spectator = createComponent({ detectChanges: false });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);

    // Set up the auth mock to return false for FullAdmin (i.e., not a full admin)
    // BEFORE the first change detection, so the Current Password branch renders.
    const authService = spectator.inject(MockAuthService);
    (authService.hasRole as jest.Mock).mockImplementation((_: Role | Role[]) => {
      return of(false); // Not a full admin, so Current Password field should show
    });

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    // Since hasRole returns false, Current Password should be visible
    await (await getInput('old_password')).setValue('correct');
    await (await getInput('new_password')).setValue('123456');
    await (await getInput('passwordConfirmation')).setValue('123456');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Change Password' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('user.set_password', [{
      old_password: 'correct',
      new_password: '123456',
      username: 'root',
    }]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });

  it('shows error if any happened during password change request', async () => {
    spectator = createComponent({ detectChanges: false });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);

    // Set up the auth mock to return false for FullAdmin (i.e., not a full admin)
    // BEFORE the first change detection, so the Current Password branch renders.
    const authService = spectator.inject(MockAuthService);
    (authService.hasRole as jest.Mock).mockImplementation((_: Role | Role[]) => {
      return of(false); // Not a full admin, so Current Password field should show
    });

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const error = new Error('error');
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => error));

    // Since hasRole returns false, Current Password should be visible
    await (await getInput('old_password')).setValue('incorrect');
    await (await getInput('new_password')).setValue('123456');
    await (await getInput('passwordConfirmation')).setValue('123456');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Change Password' }));
    await saveButton.click();

    expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
      .toHaveBeenCalledWith(error, expect.any(FormGroup));
  });
});
