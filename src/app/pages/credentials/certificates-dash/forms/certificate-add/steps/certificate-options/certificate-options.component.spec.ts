import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateDigestAlgorithm } from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType } from 'app/enums/certificate-key-type.enum';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  CertificateOptionsComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-options/certificate-options.component';
import { SystemGeneralService } from 'app/services';

describe('CertificateOptionsComponent', () => {
  let spectator: Spectator<CertificateOptionsComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CertificateOptionsComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('certificate.ec_curve_choices', {
          BrainpoolP512R1: 'BrainpoolP512R1',
          SECP256K1: 'SECP256K1',
        }),
      ]),
      mockProvider(SystemGeneralService, {
        getUnsignedCas: () => of([
          { id: 1, name: 'Test CA' },
          { id: 2, name: 'My CA' },
        ] as CertificateAuthority[]),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('RSA key type', () => {
    beforeEach(async () => {
      await form.fillForm({
        'Signing Certificate Authority': 'Test CA',
        'Key Type': 'RSA',
        'Key Length': '4096',
        'Digest Algorithm': 'SHA384',
        Lifetime: '3660',
      });
    });

    it('returns fields when getPayload() is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        signedby: 1,
        digest_algorithm: CertificateDigestAlgorithm.Sha384,
        lifetime: 3660,
        key_length: 4096,
        key_type: CertificateKeyType.Rsa,
      });
    });

    it('returns a summary when getSummary() is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Signing Certificate Authority',
          value: 'Test CA',
        },
        {
          label: 'Key Type',
          value: 'RSA',
        },
        {
          label: 'Key Length',
          value: '4096',
        },
        {
          label: 'Digest Algorithm',
          value: 'SHA384',
        },
        {
          label: 'Lifetime',
          value: '3660',
        },
      ]);
    });
  });

  describe('EC key type', () => {
    beforeEach(async () => {
      await form.fillForm({
        'Signing Certificate Authority': 'My CA',
        'Key Type': 'EC',
        'Digest Algorithm': 'SHA384',
        Lifetime: '3660',
      });

      await form.fillForm({
        'EC Curve': 'SECP256K1',
      });
    });

    it('returns fields when getPayload() is called for a key of EC type', () => {
      expect(spectator.component.getPayload()).toEqual({
        signedby: 2,
        ec_curve: 'SECP256K1',
        digest_algorithm: CertificateDigestAlgorithm.Sha384,
        lifetime: 3660,
        key_type: CertificateKeyType.Ec,
      });
    });

    it('returns a summary when getSummary() is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Signing Certificate Authority',
          value: 'My CA',
        },
        {
          label: 'Key Type',
          value: 'EC',
        },
        {
          label: 'EC Curve',
          value: 'SECP256K1',
        },
        {
          label: 'Digest Algorithm',
          value: 'SHA384',
        },
        {
          label: 'Lifetime',
          value: '3660',
        },
      ]);
    });
  });
});
