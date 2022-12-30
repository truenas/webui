import { Clipboard } from '@angular/cdk/clipboard';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  KeyCreatedDialogComponent,
} from 'app/pages/api-keys/components/key-created-dialog/key-created-dialog.component';

describe('KeyCreatedDialogComponent', () => {
  let spectator: Spectator<KeyCreatedDialogComponent>;
  const createComponent = createComponentFactory({
    component: KeyCreatedDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: 'my-key',
      },
      mockProvider(Clipboard),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows api key', () => {
    expect(spectator.query('.key-value')).toHaveText('my-key');
  });

  it('copies key to clipboard when Copy button is pressed', async () => {
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const copyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Copy to Clipboard' }));
    await copyButton.click();

    expect(spectator.inject(Clipboard).copy).toHaveBeenCalledWith('my-key');
  });
});
