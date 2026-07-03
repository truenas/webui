import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepHarness, MatStepperHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateDigestAlgorithm } from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType } from 'app/enums/certificate-key-type.enum';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CsrConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-constraints/csr-constraints.component';
import {
  CsrIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-identifier-and-type/csr-identifier-and-type.component';
import {
  CsrImportComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-import/csr-import.component';
import {
  CsrOptionsComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-options/csr-options.component';
import {
  CsrSubjectComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-subject/csr-subject.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { CsrAddComponent } from './csr-add.component';

describe('CsrAddComponent', () => {
  let spectator: Spectator<CsrAddComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let nextButton: TnButtonHarness;
  let activeStep: MatStepHarness;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const profile = {
    lifetime: 3650,
    key_type: CertificateKeyType.Rsa,
    cert_extensions: {
      BasicConstraints: {
        enabled: true,
      },
      ExtendedKeyUsage: {},
      KeyUsage: {},
    },
  } as CertificateProfile;
  const createComponent = createComponentFactory({
    component: CsrAddComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
    ],
    declarations: [
      CsrIdentifierAndTypeComponent,
      CsrOptionsComponent,
      CsrSubjectComponent,
      CsrConstraintsComponent,
      CsrImportComponent,
      MockComponent(SummaryComponent),
    ],
    providers: [
      mockApi([
        mockCall('webui.crypto.csr_profiles', {
          'HTTPS RSA Certificate': profile,
        }),
        mockCall('certificate.ec_curve_choices', {
          BrainpoolP512R1: 'BrainpoolP512R1',
        }),
        mockCall('certificate.extended_key_usage_choices', {
          CLIENT_AUTH: 'CLIENT_AUTH',
        }),
        mockJob('certificate.create', fakeSuccessfulJob()),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SystemGeneralService, {
        getCertificateCountryChoices: () => of({
          US: 'United States',
        }),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await updateStepHarnesses();
  });

  async function updateStepHarnesses(): Promise<void> {
    const stepper = await loader.getHarness(MatStepperHarness);
    activeStep = (await stepper.getSteps({ selected: true }))[0];

    form = await activeStep.getHarness(IxFormHarness);
    nextButton = await activeStep.getHarness(TnButtonHarness.with({ label: 'Next' }));
  }

  async function setInput(name: string, value: string): Promise<void> {
    const input = await activeStep.getHarness(TnInputHarness.with({ selector: `[formControlName="${name}"]` }));
    await input.setValue(value);
  }

  async function setCheckbox(label: string, value: boolean): Promise<void> {
    const checkbox = await activeStep.getHarness(TnCheckboxHarness.with({ label }));
    if (value) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async function selectValue(name: string, ...labels: string[]): Promise<void> {
    const select = await activeStep.getHarness(TnSelectHarness.with({ selector: `[formControlName="${name}"]` }));
    for (const label of labels) {
      await select.selectOption(label);
    }
    await select.close();
  }

  it('creates a new certificate when Type = Certificate Signing Request and form is submitted', async () => {
    await setInput('name', 'new');
    await selectValue('create_type', 'Certificate Signing Request');

    await nextButton.click();
    await updateStepHarnesses();

    await nextButton.click();
    await updateStepHarnesses();

    await selectValue('country', 'United States');
    await form.fillForm({
      'Subject Alternative Name': ['jobs.umbrella.com'],
    });
    await setInput('state', 'Pennsylvania');
    await setInput('city', 'Racoon City');
    await setInput('organization', 'Umbrella Corp');
    await setInput('organizational_unit', 'Virus Research Dept');
    await setInput('email', 'no-reply@umbrella.com');

    await nextButton.click();
    await updateStepHarnesses();

    await setCheckbox('Basic Constraints', true);
    await setCheckbox('Extended Key Usage', true);
    await setInput('path_length', '128');
    await selectValue('BasicConstraints', 'CA', 'Critical Extension');
    await selectValue('usages', 'CLIENT_AUTH');
    await setCheckbox('Critical Extension', true);

    await nextButton.click();

    await (await loader.getHarness(TnButtonHarness.with({ label: 'Save' }))).click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [
      {
        name: 'new',
        create_type: CertificateCreateType.CreateCsr,
        key_type: CertificateKeyType.Rsa,
        key_length: 2048,
        digest_algorithm: CertificateDigestAlgorithm.Sha256,
        country: 'US',
        state: 'Pennsylvania',
        city: 'Racoon City',
        organization: 'Umbrella Corp',
        organizational_unit: 'Virus Research Dept',
        email: 'no-reply@umbrella.com',
        san: ['jobs.umbrella.com'],
        cert_extensions: {
          BasicConstraints: {
            enabled: true,
            path_length: 128,
            ca: true,
            extension_critical: true,
          },
          ExtendedKeyUsage: {
            enabled: true,
            extension_critical: true,
            usages: ['CLIENT_AUTH'],
          },
          KeyUsage: {
            enabled: false,
          },
        },
      },
    ]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('imports a certificate when Type = Import CSR and form is submitted', async () => {
    await setInput('name', 'import');
    await selectValue('create_type', 'Import Certificate Signing Request');

    await nextButton.click();
    await updateStepHarnesses();

    await setInput('CSR', '-----BEGIN CERTIFICATE REQUEST-----');
    await setInput('privatekey', '-----BEGIN PRIVATE REQUEST-----');
    await setInput('passphrase', '1234567890');
    await setInput('passphrase2', '1234567890');

    await nextButton.click();

    await (await loader.getHarness(TnButtonHarness.with({ label: 'Save' }))).click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'import',
      create_type: CertificateCreateType.ImportCsr,
      CSR: '-----BEGIN CERTIFICATE REQUEST-----',
      passphrase: '1234567890',
      privatekey: '-----BEGIN PRIVATE REQUEST-----',
    }]);
  });

  it('shows summary on the last step of the wizard', async () => {
    await setInput('name', 'import');
    await selectValue('create_type', 'Import Certificate Signing Request');

    await nextButton.click();
    await updateStepHarnesses();

    await setInput(
      'CSR',
      '-----BEGIN CERTIFICATE REQUEST-----\n'
      + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
      + '-----END CERTIFICATE REQUEST-----',
    );
    await setInput('privatekey', '-----BEGIN PRIVATE-----');
    await setInput('passphrase', '1234567890');
    await setInput('passphrase2', '1234567890');

    await nextButton.click();

    const summary = spectator.query(SummaryComponent)!;
    expect(summary.summary).toEqual([
      [
        { label: 'Name', value: 'import' },
        { label: 'Type', value: 'Import Certificate Signing Request' },
      ],
      [
        { label: 'Signing Request', value: 'ABCDEF......654321' },
        { label: 'Passphrase', value: 'With passphrase' },
      ],
    ]);
  });

  it('updates form fields and sets constrains when Profile is emitted by CertificateIdentifierAndTypeComponent', async () => {
    const optionsForm = spectator.query(CsrOptionsComponent)!;
    const subjectForm = spectator.query(CsrSubjectComponent)!;

    jest.spyOn(optionsForm.form, 'patchValue');
    jest.spyOn(subjectForm.form, 'patchValue');

    const constraintsForm = spectator.query(CsrConstraintsComponent)!;
    jest.spyOn(constraintsForm, 'setFromProfile');

    await setInput('name', 'profile');
    await selectValue('profile', 'HTTPS RSA Certificate');

    const { cert_extensions: extensions, ...nonExtensionFields } = profile;
    expect(optionsForm.form.patchValue).toHaveBeenCalledWith(nonExtensionFields);
    expect(subjectForm.form.patchValue).toHaveBeenCalledWith(nonExtensionFields);
    expect(constraintsForm.setFromProfile).toHaveBeenCalledWith(extensions);
  });
});
