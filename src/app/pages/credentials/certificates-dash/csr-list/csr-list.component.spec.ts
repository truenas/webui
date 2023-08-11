import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockWebsocket, mockCall, mockJob } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CertificateEditComponent } from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { ConfirmForceDeleteCertificateComponent } from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import { CsrAddComponent } from 'app/pages/credentials/certificates-dash/csr-add/csr-add.component';
import { CertificateSigningRequestsListComponent } from 'app/pages/credentials/certificates-dash/csr-list/csr-list.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';

const certificates = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  type: 8,
  name: `cert_default_${index}`,
  certificate: '-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\n-----END CERTIFICATE-----\n',
  privatekey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWjoaj0WEOn1yQ\n-----END PRIVATE KEY-----\n',
  CSR: '--BEGIN CERTIFICATE REQUEST--',
  cert_type_CSR: true,
  cert_type: 'CERTIFICATE',
  revoked: false,
  can_be_revoked: false,
  issuer: 'external',
  common: 'localhost',
  san: [
    'DNS:localhost',
  ],
  digest_algorithm: 'SHA256',
  lifetime: 397,
  from: 'Tue Jun 20 06:55:04 2023',
  until: 'Sun Jun 20 06:55:04 2024',
})) as unknown as Certificate[];

describe('CertificateSigningRequestsListComponent', () => {
  let spectator: Spectator<CertificateSigningRequestsListComponent>;
  let loader: HarnessLoader;

  const mockDialogRef = {
    componentInstance: {
      setDescription: jest.fn(),
      setCall: jest.fn(),
      submit: jest.fn(),
      success: of(fakeSuccessfulJob(true)),
      failure: of(),
      wspost: jest.fn(),
    },
    close: jest.fn(),
    afterClosed: () => of(true),
  } as unknown as MatDialogRef<EntityJobComponent>;

  const createComponent = createComponentFactory({
    component: CertificateSigningRequestsListComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('certificate.query', certificates),
        mockJob('certificate.delete', fakeSuccessfulJob(true)),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
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
        open: jest.fn(() => mockDialogRef),
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
    expect(title).toHaveText('Certificate Signing Requests');
  });

  it('opens csr add form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CsrAddComponent);
  });

  it('opens certificate edit form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CertificateEditComponent, {
      data: certificates[0],
      wide: true,
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ConfirmForceDeleteCertificateComponent, {
      data: certificates[0],
    });
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'CN', ''],
      ['Name:cert_default_0Issuer:external', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:cert_default_1Issuer:external', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:cert_default_2Issuer:external', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:cert_default_3Issuer:external', 'CN:localhostSAN:DNS:localhost', ''],
    ];

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
