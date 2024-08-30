import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  OpenstackSwiftProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/openstack-swift-provider-form/openstack-swift-provider-form.component';

describe('OpenstackSwiftProviderFormComponent', () => {
  let spectator: Spectator<OpenstackSwiftProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: OpenstackSwiftProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
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

    const values = await form.getValues();
    expect(values).toEqual({
      'User Name': 'username',
      'API Key or Password': 'password',
      'Authentication URL': 'http://openstack.com/auth',
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
    await form.fillForm({
      'User Name': 'johny',
      'API Key or Password': 'A12345',
      'Authentication URL': 'http://new.openstack.com/auth',
      AuthVersion: 'v2',

      'Tenant Name': 'john-tenant',
      'Tenant ID': '123',
      'Auth Token': 'T1234',
      'Region Name': 'Europe',
      'Storage URL': 'http://new.openstack.com/storage',
      'Endpoint Type': 'Public',
    });

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
    await form.fillForm(
      {
        'User Name': 'johny',
        'API Key or Password': 'A12345',
        'Authentication URL': 'http://new.openstack.com/auth',
        AuthVersion: 'v3',

        'Tenant Name': 'john-tenant',
        'Tenant ID': '123',
        'Auth Token': 'T1234',
        'Region Name': 'Europe',
        'Storage URL': 'http://new.openstack.com/storage',
        'Endpoint Type': 'Public',
        'User ID': 'johny-user',
        'User Domain': 'accountants',
        'Tenant Domain': 'tenant-domain',
      },
    );

    const values = spectator.component.getSubmitAttributes();
    expect(values).toMatchObject({
      domain: 'accountants',
      tenant_domain: 'tenant-domain',
      user_id: 'johny-user',
    });
  });
});
