import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  CertificateImportComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-import/certificate-import.component';
import { ReactiveFormsModule } from '@angular/forms';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { HarnessLoader } from '@angular/cdk/testing';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

describe('CertificateImportComponent', () => {
  let spectator: Spectator<CertificateImportComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CertificateImportComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      Certificate: '-----BEGIN CERTIFICATE-----\n'
        + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
        + '-----END CERTIFICATE-----',
      'Private Key': 'ABHDDJJKEY',
      Passphrase: '123456',
      'Confirm Passphrase': '123456',
    });
  });

  it('shows fields to import a certificate', () => {
    expect(spectator.component.form.value).toEqual({
      certificate: '-----BEGIN CERTIFICATE-----\n'
        + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
        + '-----END CERTIFICATE-----',
      "passphrase": "123456",
      "passphrase2": "123456",
      "private_key": "ABHDDJJKEY"
    });
  });

  it('returns summary when getSummary() is called', () => {
    expect(spectator.component.getSummary()).toEqual([
      {
        "label": "Certificate",
        "value": "ABCDEF......654321"
      },
      {
        "label": "Passphrase",
        "value": "With passphrase"
      },
    ]);
  });
});
