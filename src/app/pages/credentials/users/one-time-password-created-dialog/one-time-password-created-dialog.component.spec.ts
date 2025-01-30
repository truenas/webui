import { Clipboard } from '@angular/cdk/clipboard';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxTextareaHarness } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { OneTimePasswordCreatedDialogComponent } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';

describe('OneTimePasswordCreatedDialogComponent', () => {
  let spectator: Spectator<OneTimePasswordCreatedDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: OneTimePasswordCreatedDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: 'some-one-time-password',
      },
      mockProvider(SnackbarService),
      mockProvider(Clipboard, {
        copy: jest.fn(() => true),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows one-time password', async () => {
    expect(spectator.query('p')).toHaveText('Success! One-Time Password has been created.');
    expect(spectator.query('p strong')).toHaveText('This is the only time the password is shown.');

    const textArea = await loader.getHarness(IxTextareaHarness.with({ label: 'One-Time Password' }));
    expect(await textArea.getValue()).toBe('some-one-time-password');
  });

  it('copies password to clipboard when Copy button is pressed', async () => {
    const copyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Copy to Clipboard' }));
    await copyButton.click();

    expect(spectator.inject(Clipboard).copy).toHaveBeenCalledWith('some-one-time-password');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('One-Time Password copied to clipboard');
  });
});
