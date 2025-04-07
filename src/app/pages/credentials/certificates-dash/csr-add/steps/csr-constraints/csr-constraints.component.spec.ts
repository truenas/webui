import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CertificateExtensions } from 'app/interfaces/certificate-authority.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CsrConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-constraints/csr-constraints.component';
import {
  BasicConstraint,
  KeyUsageFlag,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-constraints/extensions.constants';

describe('CsrConstraintsComponent', () => {
  let spectator: Spectator<CsrConstraintsComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CsrConstraintsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('certificate.extended_key_usage_choices', {
          CLIENT_AUTH: 'CLIENT_AUTH',
          CODE_SIGNING: 'CODE_SIGNING',
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
      await form.fillForm(
        {
          'Basic Constraints': true,
          'Extended Key Usage': true,
          'Key Usage': true,
          'Path Length': 128,
          'Basic Constraints Config': ['CA', 'Critical Extension'],
          Usages: ['CLIENT_AUTH', 'CODE_SIGNING'],
          'Critical Extension': true,
          'Key Usage Config': ['CRL Sign', 'Digital Signature'],
        },
      );
    });

    it('returns cert_extensions when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        cert_extensions: {
          BasicConstraints: {
            ca: true,
            enabled: true,
            extension_critical: true,
            path_length: 128,
          },
          ExtendedKeyUsage: {
            enabled: true,
            extension_critical: true,
            usages: [
              'CLIENT_AUTH',
              'CODE_SIGNING',
            ],
          },
          KeyUsage: {
            enabled: true,
            crl_sign: true,
            digital_signature: true,
          },
        },
      });
    });

    it('shows summary when getSummary is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Basic Constraints',
          value: 'CA, Critical Extension',
        },
        {
          label: 'Path Length',
          value: '128',
        },
        {
          label: 'Extended Key Usage',
          value: 'CLIENT_AUTH, CODE_SIGNING',
        },
        {
          label: 'Critical Extension',
          value: 'Yes',
        },
        {
          label: 'Key Usage',
          value: 'Digital Signature, CRL Sign',
        },
      ]);
    });
  });

  describe('some constraints used', () => {
    beforeEach(async () => {
      await form.fillForm(
        {
          'Basic Constraints': true,
          'Extended Key Usage': false,
          'Key Usage': false,
          'Path Length': 256,
          'Basic Constraints Config': ['CA', 'Critical Extension'],
        },
      );
    });

    it('returns cert_extensions when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        cert_extensions: {
          BasicConstraints: {
            enabled: true,
            ca: true,
            extension_critical: true,
            path_length: 256,
          },
          ExtendedKeyUsage: {
            enabled: false,
            extension_critical: false,
            usages: [],
          },
          KeyUsage: {
            enabled: false,
          },
        },
      });
    });

    it('shows summary when getSummary is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Basic Constraints',
          value: 'CA, Critical Extension',
        },
        {
          label: 'Path Length',
          value: '256',
        },
      ]);
    });
  });

  describe('setFromProfile', () => {
    it('sets form fields from a set of CertificateExtensions', () => {
      spectator.component.setFromProfile({
        BasicConstraints: {
          enabled: true,
          ca: false,
          extension_critical: true,
          path_length: 130,
        },
        ExtendedKeyUsage: {
          enabled: true,
          extension_critical: true,
          usages: ['CLIENT_AUTH'],
        },
        KeyUsage: {
          enabled: true,
          extension_critical: true,
          digital_signature: true,
          key_agreement: true,
        },
      } as CertificateExtensions);

      expect(spectator.component.form.value).toEqual({
        BasicConstraints: {
          enabled: true,
          BasicConstraints: [BasicConstraint.ExtensionCritical],
          path_length: 130,
        },
        ExtendedKeyUsage: {
          enabled: true,
          extension_critical: true,
          usages: ['CLIENT_AUTH'],
        },
        KeyUsage: {
          enabled: true,
          KeyUsage: [
            KeyUsageFlag.ExtensionCritical,
            KeyUsageFlag.DigitalSignature,
            KeyUsageFlag.KeyAgreement,
          ],
        },
      });
    });
  });
});
