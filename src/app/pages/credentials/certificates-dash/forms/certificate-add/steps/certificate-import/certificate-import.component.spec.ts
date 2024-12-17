import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CertificateImportComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-import/certificate-import.component';

describe('CertificateImportComponent', () => {
  let spectator: Spectator<CertificateImportComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const certificate = '-----BEGIN CERTIFICATE-----\n'
    + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
    + '-----END CERTIFICATE-----';

  const createComponent = createComponentFactory({
    component: CertificateImportComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('certificate.query', [
          {
            id: 1,
            name: 'Test CSR',
            privatekey: 'CSR Private Key',
            passphrase: 'CSR Passphrase',
            certificate: 'CSR Certificate',
          },
        ] as Certificate[]),
      ]),
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('not using an existing CSR', () => {
    beforeEach(async () => {
      await form.fillForm({
        Certificate: certificate,
        'Private Key': 'ABHDDJJKEY',
        Passphrase: '123456',
        'Confirm Passphrase': '123456',
      });
    });

    it('returns fields to import certificate when getPayload() is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        certificate,
        passphrase: '123456',
        privatekey: 'ABHDDJJKEY',
      });
    });

    it('returns summary when getSummary() is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Certificate',
          value: 'ABCDEF......654321',
        },
        {
          label: 'Passphrase',
          value: 'With passphrase',
        },
      ]);
    });
  });

  describe('using existing CSR', () => {
    beforeEach(async () => {
      await form.fillForm(
        {
          Certificate: certificate,
          'CSR exists on this system': true,
          'Certificate Signing Request': 'Test CSR',
        },
      );
    });

    it('returns fields to import certificate when getPayload() is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        certificate,
        passphrase: 'CSR Passphrase',
        privatekey: 'CSR Private Key',
      });
    });

    it('returns summary when getSummary() is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Using CSR',
          value: 'Test CSR',
        },
        {
          label: 'Certificate',
          value: 'ABCDEF......654321',
        },
        {
          label: 'Passphrase',
          value: 'With passphrase',
        },
      ]);
    });
  });
});
