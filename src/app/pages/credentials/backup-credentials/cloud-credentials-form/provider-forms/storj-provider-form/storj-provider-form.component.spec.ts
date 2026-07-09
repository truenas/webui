import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import {
  StorjProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';

describe('StorjProviderFormComponent', () => {
  let spectator: Spectator<StorjProviderFormComponent>;
  let loader: HarnessLoader;
  let details: DetailsTableHarness;
  const createComponent = createComponentFactory({
    component: StorjProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
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

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      access_key_id: 'my-key-id',
      secret_access_key: 'my-secret-key',
    });

    expect(await (await getInput('access_key_id')).getValue()).toBe('my-key-id');
    expect(await (await getInput('secret_access_key')).getValue()).toBe('my-secret-key');

    const detailValues = await details.getValues();
    expect(detailValues).toEqual({
      Endpoint: 'https://gateway.storjshare.io',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('access_key_id')).setValue('updated-key-id');
    await (await getInput('secret_access_key')).setValue('updated-secret-key');

    await setEditable('Endpoint', 'endpoint', 'https://us1.storj.io');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      access_key_id: 'updated-key-id',
      secret_access_key: 'updated-secret-key',
      endpoint: 'https://us1.storj.io',
    });
  });
});
