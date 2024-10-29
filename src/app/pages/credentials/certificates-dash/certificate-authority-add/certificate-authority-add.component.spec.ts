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
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CaCreateType } from 'app/enums/ca-create-type.enum';
import { CertificateDigestAlgorithm } from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType } from 'app/enums/certificate-key-type.enum';
import { CertificateAuthority, CertificateAuthorityUpdate } from 'app/interfaces/certificate-authority.interface';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import {
  CertificateAuthorityAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/certificate-authority-add.component';
import {
  CaIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/steps/ca-identifier-and-type/ca-identifier-and-type.component';
import {
  CaImportComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/steps/ca-import/ca-import.component';
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

// TODO: Consider building a harness for the wizard.
describe('CertificateAuthorityAddComponent', () => {
  let spectator: Spectator<CertificateAuthorityAddComponent>;
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

  const expectedInternalCa = {
    add_to_trusted_store: true,
    cert_extensions: {
      AuthorityKeyIdentifier: {
        authority_cert_issuer: false,
        enabled: false,
        extension_critical: false,
      },
      BasicConstraints: {
        ca: true,
        enabled: true,
        extension_critical: false,
        path_length: null,
      },
      ExtendedKeyUsage: {
        enabled: false,
        extension_critical: false,
        usages: [],
      },
      KeyUsage: {
        enabled: true,
      },
    },
    city: 'Racoon City',
    country: 'US',
    create_type: CaCreateType.Internal,
    digest_algorithm: CertificateDigestAlgorithm.Sha256,
    email: 'no-reply@umbrella.com',
    key_length: 2048,
    key_type: CertificateKeyType.Rsa,
    lifetime: 3650,
    name: 'new',
    organization: 'Umbrella Corp',
    organizational_unit: 'Virus Research Dept',
    san: ['jobs.umbrella.com'],
    state: 'Pennsylvania',
  } as CertificateAuthorityUpdate;

  const createComponent = createComponentFactory({
    component: CertificateAuthorityAddComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
    ],
    declarations: [
      CaIdentifierAndTypeComponent,
      CertificateOptionsComponent,
      CertificateSubjectComponent,
      CertificateConstraintsComponent,
      CaImportComponent,
      MockComponent(SummaryComponent),
    ],
    providers: [
      mockWebSocket([
        mockCall('webui.crypto.certificateauthority_profiles', {
          CA: profile,
        }),
        mockCall('certificate.ec_curve_choices', {
          BrainpoolP512R1: 'BrainpoolP512R1',
        }),
        mockCall('certificate.extended_key_usage_choices', {
          CLIENT_AUTH: 'CLIENT_AUTH',
        }),
        mockCall('certificateauthority.create'),
      ]),
      mockProvider(SlideInRef),
      mockProvider(MatSnackBar),
      mockAuth(),
      mockProvider(SystemGeneralService, {
        getUnsignedCas: () => of([
          { id: 1, name: 'Test CA' },
        ] as CertificateAuthority[]),
        getCertificateCountryChoices: () => of({
          US: 'United States',
        }),
      }),
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

    form = await activeStep.getHarnessOrNull(IxFormHarness);
    nextButton = await activeStep.getHarnessOrNull(MatStepperNextHarness.with({ text: 'Next' }));
  }

  async function fillInSubjectStep(): Promise<void> {
    await form.fillForm({
      Country: 'United States',
      State: 'Pennsylvania',
      Locality: 'Racoon City',
      Organization: 'Umbrella Corp',
      'Organizational Unit': 'Virus Research Dept',
      Email: 'no-reply@umbrella.com',
      'Subject Alternative Name': ['jobs.umbrella.com'],
    });
  }

  async function goToNextStep(): Promise<void> {
    await nextButton.click();
    await updateStepHarnesses();
  }

  it('creates a new CA when Type = Internal CA and form is submitted', async () => {
    await form.fillForm({
      Name: 'new',
      Type: 'Internal CA',
      'Add To Trusted Store': true,
    });

    await goToNextStep();
    await goToNextStep();
    await fillInSubjectStep();
    await goToNextStep();
    await goToNextStep();

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('certificateauthority.create', [expectedInternalCa]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('create a new CA when Type = Intermediate and form is submitted', async () => {
    await form.fillForm({
      Name: 'intermediate',
      Type: 'Intermediate CA',
    });

    await goToNextStep();

    await form.fillForm({
      'Signing Certificate Authority': 'Test CA',
    });
    await goToNextStep();
    await fillInSubjectStep();
    await goToNextStep();
    await goToNextStep();

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('certificateauthority.create', [{
      ...expectedInternalCa,
      name: 'intermediate',
      add_to_trusted_store: false,
      create_type: CaCreateType.Intermediate,
      signedby: 1,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('imports a certificate when Type = Import CA and form is submitted', async () => {
    await form.fillForm({
      Name: 'import',
      Type: 'Import CA',
    });

    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      Certificate: '-----BEGIN CERTIFICATE-----',
      'Private Key': '-----BEGIN PRIVATE-----',
      Passphrase: '1234567890',
      'Confirm Passphrase': '1234567890',
    });

    await nextButton.click();

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('certificateauthority.create', [{
      add_to_trusted_store: false,
      certificate: '-----BEGIN CERTIFICATE-----',
      create_type: CaCreateType.Import,
      name: 'import',
      passphrase: '1234567890',
      privatekey: '-----BEGIN PRIVATE-----',
    }]);
  });

  it('shows summary on the last step of the wizard', async () => {
    await form.fillForm({
      Name: 'new',
      Type: 'Internal CA',
    });

    await goToNextStep();
    await goToNextStep();
    await fillInSubjectStep();
    await goToNextStep();
    await goToNextStep();

    const summary = spectator.query(SummaryComponent);
    expect(summary.summary).toEqual([
      [
        { label: 'Name', value: 'new' },
        { label: 'Type', value: 'Internal CA' },
      ],
      [
        { label: 'Key Type', value: 'RSA' },
        { label: 'Key Length', value: '2048' },
        { label: 'Digest Algorithm', value: 'SHA256' },
        { label: 'Lifetime', value: '3650' },
      ],
      [
        { label: 'SAN', value: 'jobs.umbrella.com' },
        { label: 'Email', value: 'no-reply@umbrella.com' },
        {
          label: 'Subject',
          value: 'Virus Research Dept, Umbrella Corp, Racoon City, Pennsylvania, US',
        },
      ],
      [
        { label: 'Basic Constraints', value: 'CA' },
        { label: 'Key Usage', value: '' },
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
      Profile: 'CA',
    });

    const { cert_extensions: extensions, ...nonExtensionFields } = profile;
    expect(optionsForm.form.patchValue).toHaveBeenCalledWith(nonExtensionFields);
    expect(subjectForm.form.patchValue).toHaveBeenCalledWith(nonExtensionFields);
    expect(constraintsForm.setFromProfile).toHaveBeenCalledWith(extensions);
  });
});
