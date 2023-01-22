import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  CertificateCsrExistsComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-csr-exists/certificate-csr-exists.component';

describe('CertificateCsrExistsComponent', () => {
  let spectator: Spectator<CertificateCsrExistsComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: CertificateCsrExistsComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket2([
        mockCall('certificate.query', [
          {
            id: 1,
            name: 'Test CSR',
          },
          {
            id: 2,
            name: 'My CSR',
          },
        ] as Certificate[]),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      'CSR exists on this system': true,
    });
    await form.fillForm({
      'Certificate Signing Request': 'My CSR',
    });
  });

  it('shows a form with "CSR exists on this system" checkbox and a list of CSRs', () => {
    expect(spectator.component.form.value).toEqual({
      csr: 2,
      csrExistsOnSystem: true,
    });
  });

  describe('getSummary', () => {
    it('returns a form summary when called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'CSR exists on this system',
          value: 'Yes, My CSR',
        },
      ]);
    });
  });
});
