import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  mockCall, mockJob, mockWebSocket,
} from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateDigestAlgorithm } from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType } from 'app/enums/certificate-key-type.enum';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import {
  CertificateAddComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/certificate-add.component';
import {
  CertificateIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';
import {
  CertificateImportComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-import/certificate-import.component';
import {
  CertificateConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import {
  CertificateOptionsComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-options/certificate-options.component';
import {
  CertificateSubjectComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-subject/certificate-subject.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CertificateAddComponent', () => {
  let spectator: Spectator<CertificateAddComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let nextButton: MatStepperNextHarness;

  const profile = {
    lifetime: 3650,
    key_type: CertificateKeyType.Rsa,
    cert_extensions: {
      BasicConstraints: {
        enabled: true,
      },
      AuthorityKeyIdentifier: {},
      ExtendedKeyUsage: {},
      KeyUsage: {},
    },
  } as CertificateProfile;

  const createComponent = createComponentFactory({
    component: CertificateAddComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
    ],
    declarations: [
      CertificateIdentifierAndTypeComponent,
      CertificateOptionsComponent,
      CertificateSubjectComponent,
      CertificateConstraintsComponent,
      CertificateImportComponent,
      MockComponent(SummaryComponent),
    ],
    providers: [
      mockWebSocket([
        mockCall('webui.crypto.certificate_profiles', {
          'HTTPS RSA Certificate': profile,
        }),
        mockCall('certificate.ec_curve_choices', {
          BrainpoolP512R1: 'BrainpoolP512R1',
        }),
        mockCall('certificate.extended_key_usage_choices', {
          CLIENT_AUTH: 'CLIENT_AUTH',
        }),
        mockCall('certificate.query', [
          { id: 1, name: 'Test CSR' },
        ] as Certificate[]),
        mockJob('certificate.create', fakeSuccessfulJob()),
      ]),
      mockProvider(SlideInRef),
      mockProvider(MatSnackBar),
      mockProvider(SystemGeneralService, {
        getUnsignedCas: () => of([
          { id: 1, name: 'Test CA' },
        ] as CertificateAuthority[]),
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
    const activeStep = (await stepper.getSteps({ selected: true }))[0];

    form = await activeStep.getHarness(IxFormHarness);
    nextButton = await activeStep.getHarness(MatStepperNextHarness.with({ text: 'Next' }));
  }

  it('creates a new certificate when Type = Internal Certificate and form is submitted', async () => {
    await form.fillForm({
      Name: 'new',
      Type: 'Internal Certificate',
    });

    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      'Signing Certificate Authority': 'Test CA',
    });

    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      Country: 'United States',
      State: 'Pennsylvania',
      Locality: 'Racoon City',
      Organization: 'Umbrella Corp',
      'Organizational Unit': 'Virus Research Dept',
      Email: 'no-reply@umbrella.com',
      'Subject Alternative Name': ['jobs.umbrella.com'],
    });

    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm(
      {
        'Basic Constraints': true,
        'Extended Key Usage': true,
        'Path Length': 128,
        'Basic Constraints Config': ['CA', 'Critical Extension'],

        Usages: ['CLIENT_AUTH'],
        'Critical Extension': true,
      },
    );
    await nextButton.click();

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('certificate.create', [
      {
        name: 'new',
        create_type: CertificateCreateType.CreateInternal,
        signedby: 1,
        key_type: CertificateKeyType.Rsa,
        key_length: 2048,
        digest_algorithm: CertificateDigestAlgorithm.Sha256,
        lifetime: 3650,
        country: 'US',
        state: 'Pennsylvania',
        city: 'Racoon City',
        organization: 'Umbrella Corp',
        organizational_unit: 'Virus Research Dept',
        email: 'no-reply@umbrella.com',
        add_to_trusted_store: false,
        san: ['jobs.umbrella.com'],
        cert_extensions: {
          BasicConstraints: {
            enabled: true,
            path_length: 128,
            ca: true,
            extension_critical: true,
          },
          AuthorityKeyIdentifier: {
            authority_cert_issuer: false,
            enabled: false,
            extension_critical: false,
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

  it('imports a certificate when Type = Import Certificate and form is submitted', async () => {
    await form.fillForm({
      Name: 'import',
      Type: 'Import Certificate',
    });

    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      Certificate: '-----BEGIN CERTIFICATE-----',
      'CSR exists on this system': false,
      'Private Key': '-----BEGIN PRIVATE-----',
      Passphrase: '1234567890',
      'Confirm Passphrase': '1234567890',
    });

    await nextButton.click();

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'import',
      create_type: CertificateCreateType.Import,
      certificate: '-----BEGIN CERTIFICATE-----',
      passphrase: '1234567890',
      privatekey: '-----BEGIN PRIVATE-----',
      add_to_trusted_store: false,
    }]);
  });

  it('shows summary on the last step of the wizard', async () => {
    await form.fillForm({
      Name: 'import',
      Type: 'Import Certificate',
    });

    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      Certificate: '-----BEGIN CERTIFICATE-----\n'
        + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
        + '-----END CERTIFICATE-----',
      'CSR exists on this system': false,
      'Private Key': '-----BEGIN PRIVATE-----',
      Passphrase: '1234567890',
      'Confirm Passphrase': '1234567890',
    });

    await nextButton.click();

    const summary = spectator.query(SummaryComponent);
    expect(summary.summary).toEqual([
      [
        { label: 'Name', value: 'import' },
        { label: 'Type', value: 'Import Certificate' },
      ],
      [
        { label: 'Certificate', value: 'ABCDEF......654321' },
        { label: 'Passphrase', value: 'With passphrase' },
      ],
    ]);
  });

  it('updates form fields and sets constrains when Profile is emitted by CertificateIdentifierAndTypeComponent', async () => {
    const optionsForm = spectator.query(CertificateOptionsComponent);
    const subjectForm = spectator.query(CertificateSubjectComponent);

    jest.spyOn(optionsForm.form, 'patchValue');
    jest.spyOn(subjectForm.form, 'patchValue');

    const constraintsForm = spectator.query(CertificateConstraintsComponent);
    jest.spyOn(constraintsForm, 'setFromProfile');

    await form.fillForm({
      Name: 'profile',
      Profile: 'HTTPS RSA Certificate',
    });

    const { cert_extensions: extensions, ...nonExtensionFields } = profile;
    expect(optionsForm.form.patchValue).toHaveBeenCalledWith(nonExtensionFields);
    expect(subjectForm.form.patchValue).toHaveBeenCalledWith(nonExtensionFields);
    expect(constraintsForm.setFromProfile).toHaveBeenCalledWith(extensions);
  });
});
