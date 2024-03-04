import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { RedirectDialogData } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog-data.interface';
import { RedirectDialogComponent } from './redirect-dialog.component';

describe('RedirectDialogComponent', () => {
  let spectator: Spectator<RedirectDialogComponent>;
  const createComponent = createComponentFactory({
    component: RedirectDialogComponent,
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
    spectator = createComponent();
  });

  it('shows a name of dialog header', () => {
    expect(spectator.query('h1')).toHaveText('Enabled HTTPS Redirect');
  });

  it('shows message of dialog content', () => {
    expect(spectator.query('.message-content span')).toHaveText('You are trying to open:');
  });

  it('copies URL when Copy URL is pressed', async () => {
    if (!document.execCommand) {
      return;
    }

    jest.spyOn(document, 'execCommand').mockImplementation();
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Copy URL' }));
    await button.click();

    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
