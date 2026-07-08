import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { GiB } from 'app/constants/bytes.constant';
import {
  QuotasSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/quotas-section/quotas-section.component';

describe('QuotasSectionComponent', () => {
  let spectator: Spectator<QuotasSectionComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: QuotasSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  async function getInput(controlName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${controlName}"]` }));
  }

  async function getCheckbox(controlName: string): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ selector: `[formControlName="${controlName}"]` }));
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows quota related fields for this dataset', async () => {
    expect(await (await getInput('refquota')).getValue()).toBe('');
    expect(await (await getInput('refquota_warning')).getValue()).toBe('80');
    expect(await (await getInput('refquota_critical')).getValue()).toBe('95');
    expect(await (await getInput('refreservation')).getValue()).toBe('');
  });

  it('shows quota related fields for this and child datasets', async () => {
    expect(await (await getInput('quota')).getValue()).toBe('');
    expect(await (await getInput('quota_warning')).getValue()).toBe('80');
    expect(await (await getInput('quota_critical')).getValue()).toBe('95');
    expect(await (await getInput('reservation')).getValue()).toBe('');
  });

  it('returns create payload when getPayload is called', async () => {
    await (await getCheckbox('refquota_warning_inherit')).uncheck();
    await (await getCheckbox('quota_critical_inherit')).uncheck();

    await (await getInput('refreservation')).setValue('2G');
    await (await getInput('refquota_warning')).setValue('90');

    await (await getInput('quota')).setValue('3G');
    await (await getInput('reservation')).setValue('2G');
    await (await getInput('quota_critical')).setValue('60');

    expect(spectator.component.getPayload()).toEqual({
      quota: 3 * GiB,
      quota_critical: 60,
      refquota_warning: 90,
      refreservation: 2 * GiB,
      reservation: 2 * GiB,
    });
  });
});
