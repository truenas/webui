import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import { DownloadService } from 'app/services/download.service';
import { ViewCertificateDialogComponent } from './view-certificate-dialog.component';

describe('ViewCertificateDialogComponent', () => {
  let spectator: Spectator<ViewCertificateDialogComponent>;
  const createComponent = createComponentFactory({
    component: ViewCertificateDialogComponent,
    declarations: [
      MockComponent(CopyButtonComponent),
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'truenas',
          certificate: '---BEGIN CERTIFICATE---',
          extension: 'crt',
        } as ViewCertificateDialogData,
      },
      mockProvider(DownloadService),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a name of certificate in header', () => {
    expect(spectator.query('h1')).toHaveText('truenas');
  });

  it('shows certificate contents in a textarea', () => {
    expect(spectator.query('textarea')).toHaveText('---BEGIN CERTIFICATE---');
  });

  it('shows Copy button', () => {
    const copyButton = spectator.query(CopyButtonComponent);
    expect(copyButton).toBeTruthy();
  });

  it('downloads certificate using specified extension and mime type when Download button is pressed', async () => {
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Download' }));
    await button.click();

    expect(spectator.inject(DownloadService).downloadText).toHaveBeenCalledWith('---BEGIN CERTIFICATE---', 'truenas.crt');
  });
});
