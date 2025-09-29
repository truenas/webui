import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { RedirectDialogData } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog-data.interface';
import { RedirectDialog } from './redirect-dialog.component';

describe('RedirectDialogComponent', () => {
  let spectator: Spectator<RedirectDialog>;
  const createComponent = createComponentFactory({
    component: RedirectDialog,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          title: 'Enabled HTTPS Redirect',
          message: 'You are trying to open:',
          url: 'http://10.24.30.2/redirect',
        } as RedirectDialogData,
      },
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    spectator = createComponent();
  });

  it('shows a name of dialog header', () => {
    expect(spectator.query('h1')).toHaveText('Enabled HTTPS Redirect');
  });

  it('shows message of dialog content', () => {
    expect(spectator.query('.message-content span')).toHaveText('You are trying to open:');
  });

  it('copies URL when Copy URL is pressed', async () => {
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Copy URL' }));
    await button.click();

    expect(writeTextSpy).toHaveBeenCalledWith('http://10.24.30.2/redirect');
  });
});
