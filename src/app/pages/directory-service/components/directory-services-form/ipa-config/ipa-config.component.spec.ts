import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IdmapBackend } from 'app/enums/directory-services.enum';
import { IpaConfig, IpaSmbDomain } from 'app/interfaces/ipa-config.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { IpaConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ipa-config/ipa-config.component';

describe('IpaConfigComponent', () => {
  let spectator: Spectator<IpaConfigComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const mockIpaConfig: IpaConfig = {
    target_server: 'ipa.example.com',
    hostname: 'test-host',
    domain: 'example.com',
    basedn: 'dc=example,dc=com',
    validate_certificates: true,
    smb_domain: {
      name: 'test-smb',
      range_low: 100000001,
      range_high: 200000000,
      domain_name: 'SMB.EXAMPLE.COM',
      domain_sid: 'S-1-5-21-1234567890-1234567890-1234567890',
      idmap_backend: IdmapBackend.Sss,
    },
  };

  const createComponent = createComponentFactory({
    component: IpaConfigComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        ipaConfig: mockIpaConfig,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with existing IPA config', async () => {
    const values = await form.getValues();
    expect(values).toEqual(expect.objectContaining({
      'Target Server': 'ipa.example.com',
      Hostname: 'test-host',
      Domain: 'example.com',
      'Base DN': 'dc=example,dc=com',
      'Validate Certificates': true,
      'Use Default SMB Domain Configuration': false,
      Name: 'test-smb',
      'Domain Name': 'SMB.EXAMPLE.COM',
      'Domain SID': 'S-1-5-21-1234567890-1234567890-1234567890',
      'Range Low': '100000001',
      'Range High': '200000000',
    }));
  });

  it('should initialize with default SMB domain when smb_domain is null', async () => {
    const configWithoutSmbDomain = { ...mockIpaConfig, smb_domain: null as IpaSmbDomain };
    spectator.setInput('ipaConfig', configWithoutSmbDomain);
    spectator.component.ngOnInit();

    const values = await form.getValues();
    expect(values).toEqual(expect.objectContaining({
      'Use Default SMB Domain Configuration': true,
    }));
  });

  it('should handle null config input', () => {
    // Create a new component with null config from the start
    const nullConfigSpectator = createComponent({
      props: {
        ipaConfig: null,
      },
    });

    // Component should be created successfully even with null input
    expect(nullConfigSpectator.component).toBeTruthy();

    // Form should initialize with appropriate default values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((nullConfigSpectator.component as any).form.value.use_default_smb_domain).toBe(true);
  });

  describe('form validation', () => {
    it('should emit isValid false when required fields are missing', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Target Server': '',
        Hostname: '',
        Domain: '',
        'Base DN': '',
      });

      expect(emittedValid).toBe(false);
    });

    it('should emit isValid true when required fields are filled', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Target Server': 'ipa.test.com',
        Hostname: 'test_host',
        Domain: 'test.com',
        'Base DN': 'dc=test,dc=com',
        'Validate Certificates': false,
        'Use Default SMB Domain Configuration': true,
      });

      expect(emittedValid).toBe(true);
    });
  });

  describe('SMB domain configuration', () => {
    it('should show SMB domain fields when not using default', async () => {
      await form.fillForm({
        'Use Default SMB Domain Configuration': false,
      });

      const values = await form.getValues();
      expect(values).toHaveProperty('Domain Name');
      expect(values).toHaveProperty('Domain Name');
      expect(values).toHaveProperty('Domain SID');
      expect(values).toHaveProperty('Range Low');
      expect(values).toHaveProperty('Range High');
    });

    it('should hide SMB domain fields when using default', async () => {
      await form.fillForm({
        'Use Default SMB Domain Configuration': true,
      });

      await expect(
        loader.getHarness(IxInputHarness.with({ label: 'Domain Name' })),
      ).rejects.toThrow(`Failed to find element matching one of the following queries:
(IxInputHarness with host element matching selector: "ix-input" satisfying the constraints: label = "Domain Name")`);
    });
  });

  describe('form output events', () => {
    it('should emit isValid when form validity changes', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Target Server': 'valid-server',
        Hostname: 'valid-host',
        Domain: 'valid-domain',
        'Base DN': 'dc=valid,dc=com',
        'Use Default SMB Domain Configuration': true,
      });

      expect(emittedValid).toBe(true);
    });

    it('should emit configurationChanged when form values change', async () => {
      let emittedConfig: IpaConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await form.fillForm({
        'Target Server': 'new-server',
        Hostname: 'new-host',
        Domain: 'new-domain',
        'Base DN': 'dc=new,dc=com',
        'Validate Certificates': false,
        'Use Default SMB Domain Configuration': true,
      });

      expect(emittedConfig).toEqual({
        target_server: 'new-server',
        hostname: 'new-host',
        domain: 'new-domain',
        basedn: 'dc=new,dc=com',
        validate_certificates: false,
        smb_domain: null,
      });
    });

    it('should emit configurationChanged with SMB domain when not using default', async () => {
      let emittedConfig: IpaConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await form.fillForm({
        'Target Server': 'test-server',
        Hostname: 'test-host',
        Domain: 'test-domain',
        'Base DN': 'dc=test,dc=com',
        'Validate Certificates': true,
        'Use Default SMB Domain Configuration': false,
        Name: 'test-smb',
        'Domain Name': 'TEST.DOMAIN.COM',
        'Domain SID': 'S-1-5-21-1111111111-2222222222-3333333333',
        'Range Low': 150000001,
        'Range High': 250000000,
      });

      expect(emittedConfig).toEqual({
        target_server: 'test-server',
        hostname: 'test-host',
        domain: 'test-domain',
        basedn: 'dc=test,dc=com',
        validate_certificates: true,
        smb_domain: {
          name: 'test-smb',
          range_high: 250000000,
          range_low: 150000001,
          domain_name: 'TEST.DOMAIN.COM',
          domain_sid: 'S-1-5-21-1111111111-2222222222-3333333333',
          idmap_backend: IdmapBackend.Sss,
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values in form', async () => {
      let emittedConfig: IpaConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await form.fillForm({
        'Target Server': '',
        Hostname: '',
        Domain: '',
        'Base DN': '',
        'Use Default SMB Domain Configuration': true,
      });

      expect(emittedConfig).toEqual({
        target_server: '',
        hostname: '',
        domain: '',
        basedn: '',
        validate_certificates: true,
        smb_domain: null,
      });
    });

    it('should handle null form values', async () => {
      let emittedConfig: IpaConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await form.fillForm({
        'Target Server': '',
        Hostname: '',
        Domain: '',
        'Base DN': '',
        'Validate Certificates': false,
      });

      expect(emittedConfig?.target_server).toBe('');
      expect(emittedConfig?.hostname).toBe('');
      expect(emittedConfig?.domain).toBe('');
      expect(emittedConfig?.basedn).toBe('');
      expect(emittedConfig?.validate_certificates).toBe(false);
    });

    it('should handle SMB domain with null values', async () => {
      let emittedConfig: IpaConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await form.fillForm({
        'Target Server': 'test-server',
        Hostname: 'test-host',
        Domain: 'test-domain',
        'Base DN': 'dc=test,dc=com',
        'Use Default SMB Domain Configuration': false,
        Name: null,
        'Domain Name': null,
        'Domain SID': null,
      });

      expect(emittedConfig.smb_domain).toEqual({
        name: '',
        range_high: 200000000,
        range_low: 100000001,
        domain_name: '',
        domain_sid: '',
        idmap_backend: IdmapBackend.Sss,
      });
    });
  });
});
