import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CertificateExtensions } from 'app/interfaces/certificate-authority.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CertificateConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import {
  AuthorityKeyIdentifier,
  BasicConstraint,
  KeyUsageFlag,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/extensions.constants';

describe('CertificateConstraintsComponent', () => {
  let spectator: Spectator<CertificateConstraintsComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CertificateConstraintsComponent,
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
    spectator = createComponent({
      props: {
        hasAuthorityKeyIdentifier: true,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('all constraints used', () => {
    beforeEach(async () => {
      await form.fillForm(
        {
          'Basic Constraints': true,
          'Authority Key Identifier': true,
          'Extended Key Usage': true,
          'Key Usage': true,
          'Path Length': 128,
          'Basic Constraints Config': ['CA', 'Critical Extension'],
          'Authority Key Config': ['Critical Extension'],
          Usages: ['CLIENT_AUTH', 'CODE_SIGNING'],
          'Critical Extension': true,
          'Key Usage Config': ['CRL Sign', 'Digital Signature'],
        },
      );
    });

    it('returns cert_extensions when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        cert_extensions: {
          AuthorityKeyIdentifier: {
            authority_cert_issuer: false,
            enabled: true,
            extension_critical: true,
          },
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
          label: 'Authority Key Identifier',
          value: 'Critical Extension',
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
          'Authority Key Identifier': true,
          'Extended Key Usage': false,
          'Key Usage': false,
          'Path Length': 256,
          'Basic Constraints Config': ['CA', 'Critical Extension'],
          'Authority Key Config': ['Critical Extension'],
        },
      );
    });

    it('returns cert_extensions when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        cert_extensions: {
          AuthorityKeyIdentifier: {
            enabled: true,
            authority_cert_issuer: false,
            extension_critical: true,
          },
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
        {
          label: 'Authority Key Identifier',
          value: 'Critical Extension',
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
        AuthorityKeyIdentifier: {
          enabled: true,
          authority_cert_issuer: true,
          extension_critical: false,
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
        AuthorityKeyIdentifier: {
          enabled: true,
          AuthorityKeyIdentifier: [AuthorityKeyIdentifier.AuthorityCertIssuer],
        },
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

  describe('hasAuthorityKeyIdentifier = false', () => {
    beforeEach(() => {
      spectator.setInput('hasAuthorityKeyIdentifier', false);
    });

    it('does not show Authority Key Identifier section', async () => {
      const labels = await form.getLabels();
      expect(labels).not.toContain('Authority Key Identifier');
    });

    it('has empty object for Authority Key Identifier in getPayload()', () => {
      const payload = spectator.component.getPayload();
      expect(payload.cert_extensions.AuthorityKeyIdentifier).toMatchObject({});
    });

    it('does not show Authority Key Identifier in getSummary()', () => {
      const summary = spectator.component.getSummary();
      expect(summary).toHaveLength(0);
    });
  });
});
