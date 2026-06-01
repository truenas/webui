import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { BehaviorSubject, of } from 'rxjs';
import { dummyUser } from 'app/core/testing/utils/mock-auth.utils';
import { AuthService } from 'app/modules/auth/auth.service';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { PasswordChangeRequiredDialog } from './password-change-required-dialog.component';

describe('PasswordChangeRequiredDialog', () => {
  let spectator: Spectator<PasswordChangeRequiredDialog>;
  let loader: HarnessLoader;

  const mockIsPasswordChangeRequired$ = new BehaviorSubject(true);

  const createComponent = createComponentFactory({
    component: PasswordChangeRequiredDialog,
    imports: [],
    declarations: [],
    providers: [
      mockProvider(DialogRef, {
        close: jest.fn(),
      }),
      mockProvider(WebSocketHandlerService, {
        reconnect: jest.fn(),
      }),
      mockProvider(AuthService, {
        isPasswordChangeRequired$: mockIsPasswordChangeRequired$,
        logout: jest.fn(() => of()),
        requiredPasswordChanged: jest.fn(),
        user$: of(dummyUser),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders the change password form', () => {
    expect(spectator.query(ChangePasswordFormComponent)).toExist();
  });

  it('shows the Log Out button before password is changed', async () => {
    const logOutButton = await loader.getHarness(TnButtonHarness.with({ label: 'Log Out' }));
    expect(logOutButton).toBeTruthy();
  });

  it('clicking Log Out button lets user log out', async () => {
    const authService = spectator.inject(AuthService);
    const logoutSpy = jest.spyOn(authService, 'logout').mockImplementation(() => of());

    const logOutButton = await loader.getHarness(TnButtonHarness.with({ label: 'Log Out' }));
    await logOutButton.click();

    expect(logoutSpy).toHaveBeenCalled();
  });

  it('does not show the Finish button until password is changed', async () => {
    const finishButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Finish' }));
    expect(finishButton).toBeNull();
  });

  it('shows the Finish button after password is changed', async () => {
    const passwordChangeForm = spectator.query(ChangePasswordFormComponent);
    passwordChangeForm.passwordUpdated.emit();
    expect(spectator.inject(AuthService).requiredPasswordChanged).toHaveBeenCalled();
    mockIsPasswordChangeRequired$.next(false);

    const finishButton = await loader.getHarness(TnButtonHarness.with({ label: 'Finish' }));
    expect(finishButton).toBeTruthy();

    const logOutButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Log Out' }));
    expect(logOutButton).toBeNull();
  });

  it('clicking Finish button closes dialog', async () => {
    mockIsPasswordChangeRequired$.next(false);

    const finishButton = await loader.getHarness(TnButtonHarness.with({ label: 'Finish' }));
    await finishButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });
});
