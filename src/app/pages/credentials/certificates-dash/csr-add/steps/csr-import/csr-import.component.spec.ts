import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CsrImportComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-import/csr-import.component';

describe('CsrImportComponent', () => {
  let spectator: Spectator<CsrImportComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const csr = '-----BEGIN CERTIFICATE REQUEST-----\n'
    + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
    + '-----END CERTIFICATE REQUEST-----';

  const createComponent = createComponentFactory({
    component: CsrImportComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Signing Request': csr,
      'Private Key': 'ABHDDJJKEY',
      Passphrase: '123456',
      'Confirm Passphrase': '123456',
    });
  });

  it('returns fields to import certificate when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      CSR: csr,
      passphrase: '123456',
      privatekey: 'ABHDDJJKEY',
    });
  });

  it('returns summary when getSummary() is called', () => {
    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'Signing Request',
        value: 'ABCDEF......654321',
      },
      {
        label: 'Passphrase',
        value: 'With passphrase',
      },
    ]);
  });
});
