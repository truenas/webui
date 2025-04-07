import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ImportCertificateComponent } from './import-certificate.component';

describe('ImportCertificateComponent', () => {
  let spectator: Spectator<ImportCertificateComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const mockCsrs = [
    {
      id: 1,
      name: 'csr1',
      certificate: 'CSR_CERT_1',
      privatekey: 'CSR_KEY_1',
    },
  ] as Certificate[];

  const createComponent = createComponentFactory({
    component: ImportCertificateComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideInRef, {
        requireConfirmationWhen: () => of(false),
        close: jest.fn(),
      }),
      mockApi([
        mockCall('certificate.query', mockCsrs),
        mockJob('certificate.create'),
      ]),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads CSRs on init', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('certificate.query', [[['CSR', '!=', null]]]);
  });

  it('imports certificate with password', async () => {
    await form.fillForm({
      Name: 'test-cert-with-password',
      'Add To Trusted Store': true,
      Certificate: '--BEING CERTIFICATE--',
      'Private Key': '--BEING PRIVATE KEY--',
      Passphrase: 'secret123',
      'Confirm Passphrase': 'secret123',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'test-cert-with-password',
      add_to_trusted_store: true,
      certificate: '--BEING CERTIFICATE--',
      privatekey: '--BEING PRIVATE KEY--',
      passphrase: 'secret123',
      create_type: CertificateCreateType.Import,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
  });

  it('imports certificate without password', async () => {
    await form.fillForm({
      Name: 'test-cert-no-password',
      'Add To Trusted Store': false,
      Certificate: '--BEING CERTIFICATE--',
      'Private Key': '--BEING PRIVATE KEY--',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'test-cert-no-password',
      add_to_trusted_store: false,
      certificate: '--BEING CERTIFICATE--',
      privatekey: '--BEING PRIVATE KEY--',
      passphrase: null,
      create_type: CertificateCreateType.Import,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
  });

  it('imports certificate using an existing CSR', async () => {
    await form.fillForm({
      Name: 'cert-from-csr',
      'Add To Trusted Store': true,
      'CSR exists on this system': true,
      'Certificate Signing Request': 'csr1',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'cert-from-csr',
      add_to_trusted_store: true,
      certificate: 'CSR_CERT_1',
      privatekey: 'CSR_KEY_1',
      passphrase: null,
      create_type: CertificateCreateType.Import,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
  });
});
