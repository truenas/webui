import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import {
  S3ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';

describe('S3ProviderFormComponent', () => {
  let spectator: Spectator<S3ProviderFormComponent>;
  let loader: HarnessLoader;
  let details: DetailsTableHarness;
  const createComponent = createComponentFactory({
    component: S3ProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  async function setEditable(label: string, controlName: string, value: string): Promise<void> {
    const editable = await details.getHarnessForItem(label, EditableHarness);
    await editable.open();
    await (await getInput(controlName)).setValue(value);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    details = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, DetailsTableHarness);
  });

  it('defaults sign_accept_encoding to true', async () => {
    expect(await (await getCheckbox('sign_accept_encoding')).isChecked()).toBe(true);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      access_key_id: '12345678',
      endpoint: 'https://kms-fips.us-west-2.amazonaws.com',
      max_upload_parts: 10000,
      region: 'us-west-2',
      secret_access_key: 'key',
      signatures_v2: true,
      skip_region: false,
      sign_accept_encoding: false,
    });

    expect(await (await getInput('access_key_id')).getValue()).toBe('12345678');
    expect(await (await getInput('secret_access_key')).getValue()).toBe('key');
    expect(await (await getCheckbox('signatures_v2')).isChecked()).toBe(true);
    expect(await (await getCheckbox('skip_region')).isChecked()).toBe(false);
    expect(await (await getCheckbox('sign_accept_encoding')).isChecked()).toBe(false);

    const detailValues = await details.getValues();
    expect(detailValues).toEqual({
      'Endpoint URL': 'https://kms-fips.us-west-2.amazonaws.com',
      'Maximum Upload Parts': '10000',
      Region: 'us-west-2',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('access_key_id')).setValue('87654321');
    await (await getInput('secret_access_key')).setValue('secret');
    await (await getCheckbox('signatures_v2')).uncheck();
    await (await getCheckbox('skip_region')).check();
    await (await getCheckbox('sign_accept_encoding')).uncheck();

    await setEditable('Maximum Upload Parts', 'max_upload_parts', '9000');
    await setEditable('Region', 'region', 'us-east-1');
    await setEditable('Endpoint URL', 'endpoint', 'https://new.us-west-2.amazonaws.com');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      access_key_id: '87654321',
      secret_access_key: 'secret',

      max_upload_parts: 9000,
      region: 'us-east-1',
      endpoint: 'https://new.us-west-2.amazonaws.com',

      signatures_v2: false,
      skip_region: true,
      sign_accept_encoding: false,
    });
  });
});
