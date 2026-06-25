import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
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
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/acmedns-form/acmedns-form.component';

describe('AcmednsFormComponent', () => {
  let spectator: Spectator<AcmednsFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingAcmedns = {
    id: 123,
    name: 'name_test',
    attributes: {
      authenticator: DnsAuthenticatorType.Route53,
      access_key_id: 'access_key_id',
      secret_access_key: 'secret_access_key',
    },
  } as DnsAuthenticator;

  const slideInRef: SlideInRef<DnsAuthenticator | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
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

      // Static fields (still ix-*) come from the IxFormHarness
      expect(values.Name).toBe('name_test');
      expect(values.Authenticator).toBe('route53');

      // Dynamic fields (now tn-input) are read via their controlName
      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'access_key_id' }));
      const secretAccessKey = await loader.getHarness(TnInputHarness.with({ name: 'secret_access_key' }));
      expect(await accessKeyId.getValue()).toBe('access_key_id');
      expect(await secretAccessKey.getValue()).toBe('secret_access_key');
    });

    it('edits existing DNS Authenticator when form opened for edit is submitted', async () => {
      // First change the authenticator type
      await form.fillForm({
        Authenticator: 'cloudflare',
      });

      spectator.detectChanges();

      // Now fill the cloudflare-specific fields
      await form.fillForm({
        Name: 'name_edit',
      });
      const apiToken = await loader.getHarness(TnInputHarness.with({ name: 'api_token' }));
      await apiToken.setValue('new_api_token');

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
      });
      const cloudflareEmail = await loader.getHarness(TnInputHarness.with({ name: 'cloudflare_email' }));
      const apiKey = await loader.getHarness(TnInputHarness.with({ name: 'api_key' }));
      await cloudflareEmail.setValue('aaa@aaa.com');
      await apiKey.setValue('new_api_key');

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

  describe('Cloudflare validation', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows error when Cloudflare Email is invalid', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });
      const cloudflareEmail = await loader.getHarness(TnInputHarness.with({ name: 'cloudflare_email' }));
      await cloudflareEmail.setValue('invalid-email');

      spectator.detectChanges();

      expect(spectator.component.formGroup.errors).toEqual({
        cloudflareEmailInvalid: {
          message: 'Cloudflare Email must be a valid email address',
        },
      });

      const errorElement = spectator.query('.cloudflare-validation-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Cloudflare Email must be a valid email address');
    });

    it('shows error when both API Token and API Key are provided', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });
      const apiToken = await loader.getHarness(TnInputHarness.with({ name: 'api_token' }));
      const apiKey = await loader.getHarness(TnInputHarness.with({ name: 'api_key' }));
      await apiToken.setValue('test_token');
      await apiKey.setValue('test_key');

      spectator.detectChanges();

      expect(spectator.component.formGroup.errors).toEqual({
        cloudflareMutuallyExclusive: {
          message: 'You can use either an API Token or the combination of Cloudflare Email + API Key, but not both',
        },
      });

      const errorElement = spectator.query('.cloudflare-validation-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('You can use either an API Token or the combination of Cloudflare Email + API Key, but not both');
    });

    it('shows error when Cloudflare Email is provided without API Key', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });
      const cloudflareEmail = await loader.getHarness(TnInputHarness.with({ name: 'cloudflare_email' }));
      await cloudflareEmail.setValue('test@example.com');
      // API Key left empty

      spectator.detectChanges();

      expect(spectator.component.formGroup.errors).toEqual({
        cloudflareApiKey: {
          message: 'Cloudflare Email requires Global API Key',
        },
      });

      const errorElement = spectator.query('.cloudflare-validation-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Cloudflare Email requires Global API Key');
    });

    it('shows error when API Key is provided without Cloudflare Email', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });
      const apiKey = await loader.getHarness(TnInputHarness.with({ name: 'api_key' }));
      await apiKey.setValue('test_key');

      spectator.detectChanges();

      expect(spectator.component.formGroup.errors).toEqual({
        cloudflareEmailRequired: {
          message: 'API Key requires Cloudflare Email',
        },
      });

      const errorElement = spectator.query('.cloudflare-validation-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('API Key requires Cloudflare Email');
    });

    it('shows hint when neither API Token nor API Key is provided', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });

      spectator.detectChanges();

      expect(spectator.component.formGroup.errors).toEqual({
        cloudflareAuth: {
          message: 'Either API Token or Cloudflare Email + API Key must be provided',
        },
      });

      // When cloudflareAuth is the only error, it shows as a hint (not red)
      const hintElement = spectator.query('.cloudflare-hint');
      expect(hintElement).toBeTruthy();
      expect(hintElement.textContent).toContain('Either API Token or Cloudflare Email + API Key must be provided');
    });

    it('shows cloudflareAuth as hint always (never as red error)', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });
      const cloudflareEmail = await loader.getHarness(TnInputHarness.with({ name: 'cloudflare_email' }));
      await cloudflareEmail.setValue('invalid-email');

      spectator.detectChanges();

      // Invalid email creates cloudflareEmailInvalid error (red)
      // Validator returns first error, so only emailInvalid is present
      expect(spectator.component.formGroup.errors?.['cloudflareEmailInvalid']).toBeTruthy();

      const errorElement = spectator.query('.cloudflare-validation-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Cloudflare Email must be a valid email address');

      // cloudflareAuth should never appear in the error section (only as hint)
      expect(errorElement.textContent).not.toContain('Either API Token or Cloudflare Email + API Key must be provided');
    });

    it('validates successfully with API Token only', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });
      const apiToken = await loader.getHarness(TnInputHarness.with({ name: 'api_token' }));
      await apiToken.setValue('test_token');

      spectator.detectChanges();

      expect(spectator.component.formGroup.errors).toBeNull();
    });

    it('validates successfully with Email and API Key', async () => {
      await form.fillForm({
        Name: 'test',
        Authenticator: 'cloudflare',
      });
      const cloudflareEmail = await loader.getHarness(TnInputHarness.with({ name: 'cloudflare_email' }));
      const apiKey = await loader.getHarness(TnInputHarness.with({ name: 'api_key' }));
      await cloudflareEmail.setValue('test@example.com');
      await apiKey.setValue('test_key');

      spectator.detectChanges();

      expect(spectator.component.formGroup.errors).toBeNull();
    });

    it('does not validate for non-Cloudflare authenticators', async () => {
      // First change to route53
      await form.fillForm({
        Name: 'test',
        Authenticator: 'route53',
      });

      spectator.detectChanges();

      // Now fill route53-specific fields
      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'access_key_id' }));
      const secretAccessKey = await loader.getHarness(TnInputHarness.with({ name: 'secret_access_key' }));
      await accessKeyId.setValue('test_key');
      await secretAccessKey.setValue('test_secret');

      spectator.detectChanges();

      // Cloudflare validator shouldn't run for route53
      expect(spectator.component.formGroup.errors).toBeNull();
    });
  });
});
