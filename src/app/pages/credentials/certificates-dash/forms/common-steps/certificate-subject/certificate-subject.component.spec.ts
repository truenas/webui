import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CertificateSubjectComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-subject/certificate-subject.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('CertificateSubjectComponent', () => {
  let spectator: Spectator<CertificateSubjectComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CertificateSubjectComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(SystemGeneralService, {
        getCertificateCountryChoices: () => of({
          CA: 'Canada',
          US: 'United States',
        }),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      Country: 'United States',
      State: 'Pennsylvania',
      Locality: 'Racoon City',
      Organization: 'Umbrella Corp',
      'Organizational Unit': 'Virus Research Dept',
      Email: 'no-reply@umbrella.com',
      'Common Name': 'virus.umbrella.com',
      'Subject Alternative Name': ['jobs.umbrella.com', 'security.umbrella.com'],
    });
  });

  it('returns subject fields when getPayload() is called', () => {
    expect(spectator.component.form.value).toEqual({
      country: 'US',
      state: 'Pennsylvania',
      city: 'Racoon City',
      organization: 'Umbrella Corp',
      organizational_unit: 'Virus Research Dept',
      email: 'no-reply@umbrella.com',
      common: 'virus.umbrella.com',
      san: ['jobs.umbrella.com', 'security.umbrella.com'],
    });
  });

  describe('getSummary', () => {
    it('returns a summary of fields when all fields are set', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'SAN',
          value: 'jobs.umbrella.com, security.umbrella.com',
        },
        {
          label: 'Common Name',
          value: 'virus.umbrella.com',
        },
        {
          label: 'Email',
          value: 'no-reply@umbrella.com',
        },
        {
          label: 'Subject',
          value: 'Virus Research Dept, Umbrella Corp, Racoon City, Pennsylvania, US',
        },
      ]);
    });

    it('skips some of the fields when they are missing', async () => {
      await form.fillForm({
        'Organizational Unit': '',
        'Common Name': '',
      });

      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'SAN',
          value: 'jobs.umbrella.com, security.umbrella.com',
        },
        {
          label: 'Email',
          value: 'no-reply@umbrella.com',
        },
        {
          label: 'Subject',
          value: 'Umbrella Corp, Racoon City, Pennsylvania, US',
        },
      ]);
    });
  });
});
