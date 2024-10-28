import { Clipboard } from '@angular/cdk/clipboard';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxTextareaHarness } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { KeyCreatedDialogComponent } from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';

describe('KeyCreatedDialogComponent', () => {
  let spectator: Spectator<KeyCreatedDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: KeyCreatedDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: 'my-key',
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

  it('shows api key', async () => {
    expect(spectator.query('p')).toHaveText('Success! The API key has been created or reset.');
    expect(spectator.query('p strong')).toHaveText('This is the only time the key is shown.');

    const textArea = await loader.getHarness(IxTextareaHarness.with({ label: 'API Key' }));
    expect(await textArea.getValue()).toBe('my-key');
  });

  it('copies key to clipboard when Copy button is pressed', async () => {
    const copyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Copy to Clipboard' }));
    await copyButton.click();

    expect(spectator.inject(Clipboard).copy).toHaveBeenCalledWith('my-key');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('API Key copied to clipboard');
  });
});
