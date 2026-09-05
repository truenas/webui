import { Clipboard } from '@angular/cdk/clipboard';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { S3AccessKey } from 'app/interfaces/s3.interface';
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
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
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
    expect(spectator.query('tn-banner')).toHaveText('This is the only time the secret access key is shown.');
  });

  it('shows access key id and secret', async () => {
    const [accessKeyId, secret] = await loader.getAllHarnesses(TnInputHarness);
    expect(await accessKeyId.getValue()).toBe('AKIAEXAMPLE12345');
    expect(await secret.getValue()).toBe('supersecretvalue');
  });

  it('copies secret to clipboard when Copy Secret is pressed', async () => {
    const copyButton = await loader.getHarness(TnButtonHarness.with({ label: 'Copy Secret' }));
    await copyButton.click();

    expect(spectator.inject(Clipboard).copy).toHaveBeenCalledWith('supersecretvalue');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Secret access key copied to clipboard');
  });
});
