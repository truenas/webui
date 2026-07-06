import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CsrSubjectComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-subject/csr-subject.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('CsrSubjectComponent', () => {
  let spectator: Spectator<CsrSubjectComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CsrSubjectComponent,
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

  async function setText(values: Record<string, string>): Promise<void> {
    for (const [name, value] of Object.entries(values)) {
      if (value === '') {
        (spectator.component.form.controls as Record<string, AbstractControl>)[name].setValue('');
      } else {
        await (await loader.getHarness(
          TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
        )).setValue(value);
      }
    }
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const countrySelect = await loader.getHarness(
      TnSelectHarness.with({ selector: '[formControlName="country"]' }),
    );
    await countrySelect.selectOption('United States');
    await form.fillForm({
      'Subject Alternative Name': ['jobs.umbrella.com', 'security.umbrella.com'],
    });

    await setText({
      state: 'Pennsylvania',
      city: 'Racoon City',
      organization: 'Umbrella Corp',
      organizational_unit: 'Virus Research Dept',
      email: 'no-reply@umbrella.com',
      common: 'virus.umbrella.com',
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
      await setText({
        organizational_unit: '',
        common: '',
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
