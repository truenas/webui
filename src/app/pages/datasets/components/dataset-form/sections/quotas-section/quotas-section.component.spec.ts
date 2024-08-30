import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import {
  QuotasSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/quotas-section/quotas-section.component';

describe('QuotasSectionComponent', () => {
  let spectator: Spectator<QuotasSectionComponent>;
  let loader: HarnessLoader;
  let currentFieldset: IxFieldsetHarness;
  let currentAndChildFieldset: IxFieldsetHarness;
  const createComponent = createComponentFactory({
    component: QuotasSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    currentFieldset = await loader.getHarness(IxFieldsetHarness.with({
      title: 'This Dataset',
    }));
    currentAndChildFieldset = await loader.getHarness(IxFieldsetHarness.with({
      title: 'This Dataset and Child Datasets',
    }));
  });

  it('shows quota related fields for this dataset', async () => {
    expect(await currentFieldset.getValues()).toEqual(expect.objectContaining({
      'Quota for this dataset': '',
      'Quota warning alert at, %': '80',
      'Quota critical alert at, %': '95',
      'Reserved space for this dataset': '',
    }));
  });

  it('shows quota related fields for this and child datasets', async () => {
    expect(await currentAndChildFieldset.getValues()).toEqual(expect.objectContaining({
      'Quota for this dataset and all children': '',
      'Quota warning alert at, %': '80',
      'Quota critical alert at, %': '95',
      'Reserved space for this dataset and all children': '',
    }));
  });

  it('returns create payload when getPayload is called', async () => {
    const inheritCheckboxes = await loader.getAllHarnesses(IxCheckboxHarness);
    await inheritCheckboxes[0].setValue(false);
    await inheritCheckboxes[3].setValue(false);

    await currentFieldset.fillForm({
      'Reserved space for this dataset': '2G',
      'Quota warning alert at, %': 90,
    });

    await currentAndChildFieldset.fillForm({
      'Quota for this dataset and all children': '3G',
      'Reserved space for this dataset and all children': '2G',
      'Quota critical alert at, %': 60,
    });

    expect(spectator.component.getPayload()).toEqual({
      quota: 3 * GiB,
      quota_critical: 60,
      refquota_warning: 90,
      refreservation: 2 * GiB,
      reservation: 2 * GiB,
    });
  });
});
