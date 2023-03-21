import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  CaImportComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/steps/ca-import/ca-import.component';

describe('CaImportComponent', () => {
  let spectator: Spectator<CaImportComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const certificate = '-----BEGIN CERTIFICATE-----\n'
    + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
    + '-----END CERTIFICATE-----';

  const createComponent = createComponentFactory({
    component: CaImportComponent,
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
