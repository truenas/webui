import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { SchemaType } from 'app/enums/schema.enum';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { Option } from 'app/interfaces/option.interface';
import { Schema } from 'app/interfaces/schema.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';

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

  const slideInRef: SlideInRef<DnsAuthenticator | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: AcmednsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService),
      mockApi([
        mockCall('acme.dns.authenticator.create'),
        mockCall('acme.dns.authenticator.update'),
        mockCall('acme.dns.authenticator.authenticator_schemas', [{
          key: DnsAuthenticatorType.Cloudflare,
          schema: {
            properties: {
              cloudflare_email: {
                _name_: 'cloudflare_email', _required_: false, title: 'Cloudflare Email', type: SchemaType.String,
              },
              api_key: {
                _name_: 'api_key', _required_: false, title: 'API Key', type: SchemaType.String,
              },
              api_token: {
                _name_: 'api_token', _required_: false, title: 'API Token', type: SchemaType.String,
              },
            },
          } as unknown as Schema,
        }, {
          key: DnsAuthenticatorType.Route53,
          schema: {
            properties: {
              access_key_id: {
                _name_: 'access_key_id', _required_: true, title: 'Access Key ID', type: SchemaType.String,
              },
              secret_access_key: {
                _name_: 'secret_access_key', _required_: true, title: 'Secret Access Key', type: SchemaType.String,
              },
            },
          } as unknown as Schema,
        }]),
      ]),
      mockAuth(),
    ],
  });

  describe('Edit DNS', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => existingAcmedns) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing DNS Authenticator when form is opened for edit', async () => {
      spectator.component.ngOnInit();

      let authenticator: Option[] = [];
      spectator.component.authenticatorOptions$.subscribe((options) => authenticator = options);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('acme.dns.authenticator.authenticator_schemas');

      expect(authenticator).toEqual([
        { label: 'cloudflare', value: 'cloudflare' },
        { label: 'route53', value: 'route53' },
      ]);

      const values = await form.getValues();
      const disabledState = await form.getDisabledState();

      expect(values).toEqual({
        Name: 'name_test',
        Authenticator: 'route53',
        'Access Key ID': 'access_key_id',
        'Secret Access Key': 'secret_access_key',
      });

      expect(disabledState).toEqual({
        Name: false,
        Authenticator: false,
        'Access Key ID': false,
        'Secret Access Key': false,
      });
    });

    it('edits existing DNS Authenticator when form opened for edit is submitted', async () => {
      await form.fillForm({
        Name: 'name_edit',
        Authenticator: 'cloudflare',
        'Cloudflare Email': '',
        'API Key': '',
        'API Token': 'new_api_token',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith(
        'acme.dns.authenticator.update',
        [
          123,
          {
            name: 'name_edit',
            attributes: {
              authenticator: 'cloudflare',
              api_token: 'new_api_token',
            },
          },
        ],
      );
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('Add new DNS', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('add new DNS Authenticator when form is submitted', async () => {
      await form.fillForm({
        Name: 'name_new',
        Authenticator: 'cloudflare',
        'Cloudflare Email': 'aaa@aaa.com',
        'API Key': 'new_api_key',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('acme.dns.authenticator.create', [{
        name: 'name_new',
        attributes: {
          authenticator: 'cloudflare',
          api_key: 'new_api_key',
          cloudflare_email: 'aaa@aaa.com',
        },
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
