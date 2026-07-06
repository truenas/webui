import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CertificateExtensions } from 'app/interfaces/certificate.interface';
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

  const selectMulti = async (name: string, values: string[]): Promise<void> => {
    const select = await loader.getHarness(
      TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
    );
    for (const value of values) {
      await select.selectOption(value);
    }
    await select.close();
  };

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

  const setCheckbox = async (label: string, value: boolean): Promise<void> => {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label }));
    if (value) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  };

  const setPathLength = async (value: string): Promise<void> => {
    const input = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="path_length"]' }));
    await input.setValue(value);
  };

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('all constraints used', () => {
    beforeEach(async () => {
      await setCheckbox('Basic Constraints', true);
      await setCheckbox('Extended Key Usage', true);
      await setCheckbox('Key Usage', true);

      await setPathLength('128');
      await selectMulti('BasicConstraints', ['CA', 'Critical Extension']);
      await selectMulti('usages', ['CLIENT_AUTH', 'CODE_SIGNING']);
      await selectMulti('KeyUsage', ['Digital Signature', 'CRL Sign']);
      await setCheckbox('Critical Extension', true);
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
      await setCheckbox('Basic Constraints', true);
      await setCheckbox('Extended Key Usage', false);
      await setCheckbox('Key Usage', false);

      await setPathLength('256');
      await selectMulti('BasicConstraints', ['CA', 'Critical Extension']);
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
