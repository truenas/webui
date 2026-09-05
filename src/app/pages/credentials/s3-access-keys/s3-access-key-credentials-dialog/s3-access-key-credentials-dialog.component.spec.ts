import { Clipboard } from '@angular/cdk/clipboard';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';

describe('S3AccessKeyCredentialsDialogComponent', () => {
  let spectator: Spectator<S3AccessKeyCredentialsDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: S3AccessKeyCredentialsDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'backup-key',
          username: 'alice',
          access_key: 'AKIAEXAMPLE12345',
          secret: 'supersecretvalue',
        } as S3AccessKey,
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

  it('warns that the secret is shown only once', () => {
    expect(spectator.query('.warning-message')).toHaveText('This is the only time the secret access key is shown.');
  });

  it('shows access key id and secret', async () => {
    const accessKeyId = await loader.getHarness(IxInputHarness.with({ label: 'Access Key ID' }));
    expect(await accessKeyId.getValue()).toBe('AKIAEXAMPLE12345');

    const secret = await loader.getHarness(IxInputHarness.with({ label: 'Secret Access Key' }));
    expect(await secret.getValue()).toBe('supersecretvalue');
  });

  it('copies secret to clipboard when Copy Secret is pressed', async () => {
    const copyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Copy Secret' }));
    await copyButton.click();

    expect(spectator.inject(Clipboard).copy).toHaveBeenCalledWith('supersecretvalue');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Secret access key copied to clipboard');
  });
});
