import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialogHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import { DownloadService } from 'app/services/download.service';
import { ViewCertificateDialog } from './view-certificate-dialog.component';

describe('ViewCertificateDialogComponent', () => {
  let spectator: Spectator<ViewCertificateDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ViewCertificateDialog,
    declarations: [
      MockComponent(CopyButtonComponent),
    ],
    providers: [
      {
        provide: DIALOG_DATA,
        useValue: {
          name: 'truenas',
          certificate: '---BEGIN CERTIFICATE---',
          extension: 'crt',
          mimeType: 'application/x-x509-user-cert',
        } as ViewCertificateDialogData,
      },
      mockProvider(DownloadService),
      mockProvider(DialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a name of certificate in header', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('truenas');
  });

  it('shows certificate contents in a textarea', () => {
    expect(spectator.query('textarea')).toHaveText('---BEGIN CERTIFICATE---');
  });

  it('shows Copy button', () => {
    const copyButton = spectator.query(CopyButtonComponent);
    expect(copyButton).toBeTruthy();
  });

  it('downloads certificate using specified extension and mime type when Download button is pressed', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Download' }));
    await button.click();

    const expectedBlob = new Blob(['---BEGIN CERTIFICATE---'], { type: 'application/x-x509-user-cert' });
    expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(expectedBlob, 'truenas.crt');
  });
});
