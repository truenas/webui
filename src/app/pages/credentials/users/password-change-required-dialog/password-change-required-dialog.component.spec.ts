import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { PasswordChangeRequiredDialogComponent } from 'app/pages/credentials/users/password-change-required-dialog/password-change-required-dialog.component';

describe('PasswordChangeRequiredDialogComponent', () => {
  let spectator: Spectator<PasswordChangeRequiredDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PasswordChangeRequiredDialogComponent,
    imports: [],
    declarations: [],
    providers: [
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders the change password form', () => {
    expect(spectator.query(ChangePasswordFormComponent)).toExist();
  });

  it('does not show the Finish button until password is changed', async () => {
    const finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();
  });

  it('shows the Finish button after password is changed', async () => {
    spectator.component.passwordChanged();
    spectator.detectChanges();

    const finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeTruthy();
  });

  it('clicking Finish button closes dialog', async () => {
    spectator.component.passwordChanged();
    spectator.detectChanges();

    const finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    await finishButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
