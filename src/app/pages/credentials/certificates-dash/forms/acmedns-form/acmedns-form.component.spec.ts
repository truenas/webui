import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { AuthenticatorSchema, DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { Option } from 'app/interfaces/option.interface';
import { Schema } from 'app/interfaces/schema.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('AcmednsFormComponent', () => {
  let spectator: Spectator<AcmednsFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingAcmedns = {
    id: 123,
    name: 'name_test',
    authenticator: DnsAuthenticatorType.Route53,
    attributes: {
      access_key_id: 'access_key_id',
      secret_access_key: 'secret_access_key',
    },
  } as DnsAuthenticator;

  const createComponent = createComponentFactory({
    component: AcmednsFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('acme.dns.authenticator.create'),
        mockCall('acme.dns.authenticator.update'),
        mockCall('acme.dns.authenticator.authenticator_schemas', [{
          key: 'cloudflare' as DnsAuthenticatorType,
          schema: [
            {
              _name_: 'cloudflare_email', _required_: false, title: 'Cloudflare Email', type: 'string',
            },
            {
              _name_: 'api_key', _required_: false, title: 'API Key', type: 'string',
            },
            {
              _name_: 'api_token', _required_: false, title: 'API Token', type: 'string',
            },
          ] as Schema[],
        }, {
          key: 'route53' as DnsAuthenticatorType,
          schema: [
            {
              _name_: 'access_key_id', _required_: true, title: 'Access Key Id', type: 'string',
            },
            {
              _name_: 'secret_access_key', _required_: true, title: 'Secret Access Key', type: 'string',
            },
          ] as Schema[],
        }] as AuthenticatorSchema[]),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows values for an existing DNS Authenticator when form is opened for edit', async () => {
    spectator.component.setAcmednsForEdit(existingAcmedns);
    spectator.component.ngOnInit();

    let authenticator: Option[];
    spectator.component.authenticatorOptions$.subscribe((options) => authenticator = options);

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('acme.dns.authenticator.authenticator_schemas');

    expect(authenticator).toEqual([
      { label: 'cloudflare', value: 'cloudflare' },
      { label: 'route53', value: 'route53' },
    ]);

    const values = await form.getValues();
    const disabledState = await form.getDisabledState();

    expect(values).toEqual({
      Name: 'name_test',
      Authenticator: 'route53',
      'Access Key Id': 'access_key_id',
      'Secret Access Key': 'secret_access_key',
      'Cloudflare Email': '',
      'API Key': '',
      'API Token': '',
    });

    expect(disabledState).toEqual({
      Name: false,
      Authenticator: false,
      'Access Key Id': false,
      'Secret Access Key': false,
      'Cloudflare Email': true,
      'API Key': true,
      'API Token': true,
    });
  });

  it('add new DNS Authenticator when form is submitted', async () => {
    await form.fillForm({
      Name: 'name_new',
      Authenticator: 'cloudflare',
      'Access Key Id': '',
      'Secret Access Key': '',
      'Cloudflare Email': 'aaa@aaa.com',
      'API Key': 'new_api_key',
      'API Token': '',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('acme.dns.authenticator.create', [{
      name: 'name_new',
      authenticator: 'cloudflare',
      attributes: {
        api_key: 'new_api_key',
        cloudflare_email: 'aaa@aaa.com',
      },
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('edits existing DNS Authenticator when form opened for edit is submitted', async () => {
    spectator.component.setAcmednsForEdit(existingAcmedns);

    await form.fillForm({
      Name: 'name_edit',
      Authenticator: 'cloudflare',
      'Cloudflare Email': '',
      'API Key': '',
      'API Token': 'new_api_token',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith(
      'acme.dns.authenticator.update',
      [
        123,
        {
          name: 'name_edit',
          attributes: {
            api_token: 'new_api_token',
          },
        },
      ],
    );
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});
