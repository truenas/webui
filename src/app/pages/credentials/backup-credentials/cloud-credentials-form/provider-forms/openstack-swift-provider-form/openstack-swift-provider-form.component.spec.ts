import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import {
  OpenstackSwiftProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/openstack-swift-provider-form/openstack-swift-provider-form.component';

describe('OpenstackSwiftProviderFormComponent', () => {
  let spectator: Spectator<OpenstackSwiftProviderFormComponent>;
  let loader: HarnessLoader;
  let details: DetailsTableHarness;
  const createComponent = createComponentFactory({
    component: OpenstackSwiftProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  async function setEditableInput(label: string, controlName: string, value: string): Promise<void> {
    const editable = await details.getHarnessForItem(label, EditableHarness);
    await editable.open();
    await (await getInput(controlName)).setValue(value);
  }

  async function setEditableSelect(label: string, controlName: string, optionLabel: string): Promise<void> {
    const editable = await details.getHarnessForItem(label, EditableHarness);
    await editable.open();
    await (await loader.getHarness(
      TnSelectHarness.with({ selector: `[formControlName="${controlName}"]` }),
    )).selectOption(optionLabel);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    details = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, DetailsTableHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      user: 'username',
      key: 'password',
      auth: 'http://openstack.com/auth',
      auth_version: 0,
      tenant: 'tenant',
      tenant_id: '243',
      auth_token: 'token',
      region: 'Africa',
      storage_url: 'http://openstack.com/storage',
      endpoint_type: 'internal',
    });

    expect(await (await getInput('user')).getValue()).toBe('username');
    expect(await (await getInput('key')).getValue()).toBe('password');
    expect(await (await getInput('auth')).getValue()).toBe('http://openstack.com/auth');

    const detailValues = await details.getValues();
    expect(detailValues).toEqual({
      AuthVersion: 'Auto(vX)',
      'Tenant Name': 'tenant',
      'Tenant ID': '243',
      'Auth Token': 'token',
      'Region Name': 'Africa',
      'Storage URL': 'http://openstack.com/storage',
      'Endpoint Type': 'Internal',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('user')).setValue('johny');
    await (await getInput('key')).setValue('A12345');
    await (await getInput('auth')).setValue('http://new.openstack.com/auth');

    await setEditableSelect('AuthVersion', 'auth_version', 'v2');
    await setEditableInput('Tenant Name', 'tenant', 'john-tenant');
    await setEditableInput('Tenant ID', 'tenant_id', '123');
    await setEditableInput('Auth Token', 'auth_token', 'T1234');
    await setEditableInput('Region Name', 'region', 'Europe');
    await setEditableInput('Storage URL', 'storage_url', 'http://new.openstack.com/storage');
    await setEditableSelect('Endpoint Type', 'endpoint_type', 'Public');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      user: 'johny',
      key: 'A12345',
      auth: 'http://new.openstack.com/auth',
      auth_version: 2,

      tenant: 'john-tenant',
      tenant_id: '123',
      auth_token: 'T1234',
      region: 'Europe',
      storage_url: 'http://new.openstack.com/storage',
      endpoint_type: 'public',
    });
  });

  it('shows and returns additional attributes when AuthVersion is v3', async () => {
    await (await getInput('user')).setValue('johny');
    await (await getInput('key')).setValue('A12345');
    await (await getInput('auth')).setValue('http://new.openstack.com/auth');

    await setEditableSelect('AuthVersion', 'auth_version', 'v3');
    await setEditableInput('User ID', 'user_id', 'johny-user');
    await setEditableInput('User Domain', 'domain', 'accountants');
    await setEditableInput('Tenant Domain', 'tenant_domain', 'tenant-domain');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toMatchObject({
      domain: 'accountants',
      tenant_domain: 'tenant-domain',
      user_id: 'johny-user',
    });
  });
});
