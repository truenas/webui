import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { PasswordChangeRequiredDialog } from './password-change-required-dialog.component';

describe('PasswordChangeRequiredDialog', () => {
  let spectator: Spectator<PasswordChangeRequiredDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PasswordChangeRequiredDialog,
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

  it('shows the Skip button before password is changed', async () => {
    const skipButton = await loader.getHarness(MatButtonHarness.with({ text: 'Skip' }));
    expect(skipButton).toBeTruthy();
  });

  it('clicking Skip button closes dialog', async () => {
    const skipButton = await loader.getHarness(MatButtonHarness.with({ text: 'Skip' }));
    await skipButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
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

    const skipButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Skip' }));
    expect(skipButton).toBeNull();
  });

  it('clicking Finish button closes dialog', async () => {
    spectator.component.passwordChanged();
    spectator.detectChanges();

    const finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    await finishButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
