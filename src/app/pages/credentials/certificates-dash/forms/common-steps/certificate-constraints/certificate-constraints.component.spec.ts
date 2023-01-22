import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  CertificateConstraintsComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import { ReactiveFormsModule } from '@angular/forms';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { HarnessLoader } from '@angular/cdk/testing';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';

describe('CertificateConstraintsComponent', () => {
  let spectator: Spectator<CertificateConstraintsComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CertificateConstraintsComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('certificate.extended_key_usage_choices', {
          CLIENT_AUTH: "CLIENT_AUTH",
          CODE_SIGNING: "CODE_SIGNING"
        }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('all constraints used', () => {
    beforeEach(async () => {
      await form.fillForm({
        'Basic Constraints': true,
        'Authority Key Identifier': true,
        'Extended Key Usage': true,
        'Key Usage': true,
      });
      await form.fillForm({
        'Path Length': 128,
        'Basic Constraints Config': ['CA', 'Critical Extension'],
        'Authority Key Config': ['Critical Extension'],
        'Usages': ['CLIENT_AUTH', 'CODE_SIGNING'],
        'Critical Extension': true,
        'Key Usage Config': ['CRL Sign', 'Digital Signature'],
      });
    });

    it('shows form with certificate constraints', () => {
      expect(spectator.component.form.value).toEqual(2);
    });

    it('shows summary when getSummary is called', () => {

    });
  });

  describe('some constraints used', () => {
    beforeEach(async () => {
      await form.fillForm({
        'Basic Constraints': true,
        'Authority Key Identifier': true,
        'Extended Key Usage': false,
        'Key Usage': false,
      });

      const t = await form.getControl('Basic Constraints Config') as IxSelectHarness;
      const x = await t.getOptionLabels();

      await form.fillForm({
        'Path Length': 128,
        // 'Basic Constraints Config': ['CA', 'Critical Extension'],
        'Authority Key Config': ['Critical Extension'],
      });
    });

    it('shows form with certificate constraints', () => {
      expect(spectator.component.form.value).toEqual(2);
    });

    it('shows summary when getSummary is called', () => {

    });
  });

  describe('setFromProfile', () => {
    it('sets form fields from a set of CertificateExtensions', () => {

    });
  });
});
