import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockWebsocket, mockCall, mockJob } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CertificateEditComponent } from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { ConfirmForceDeleteCertificateComponent } from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import { CertificateAddComponent } from 'app/pages/credentials/certificates-dash/forms/certificate-add/certificate-add.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { CertificateListComponent } from './certificate-list.component';

const certificates = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  type: 8,
  name: `cert_default_${index}`,
  certificate: '-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\n-----END CERTIFICATE-----\n',
  privatekey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWjoaj0WEOn1yQ\n-----END PRIVATE KEY-----\n',
  CSR: null,
  revoked_date: null,
  cert_type: 'CERTIFICATE',
  revoked: false,
  can_be_revoked: false,
  issuer: 'external',
  key_length: 2048,
  key_type: 'RSA',
  common: 'localhost',
  san: [
    'DNS:localhost',
  ],
  digest_algorithm: 'SHA256',
  lifetime: 397,
  from: 'Tue Jun 20 06:55:04 2023',
  until: 'Sun Jul 21 06:55:04 2024',
  serial: 878189416,
  chain: false,
  expired: false,
  parsed: true,
})) as unknown as Certificate[];

describe('CertificateListComponent', () => {
  let spectator: Spectator<CertificateListComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: CertificateListComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('certificate.query', certificates),
        mockJob('certificate.delete', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef, {
        slideInClosed$: of(true),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(StorageService),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Certificates');
  });

  it('opens static route form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CertificateAddComponent);
  });

  it('opens static route form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CertificateEditComponent, {
      data: {
        cert: {},
      },
    });
  });

  it('opens static route delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ConfirmForceDeleteCertificateComponent, {
      data: {
        title: 'Deleting...',
      },
      disableClose: true,
    });
  });
});
