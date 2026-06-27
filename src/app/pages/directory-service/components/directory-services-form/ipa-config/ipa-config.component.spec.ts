import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { IdmapBackend } from 'app/enums/directory-services.enum';
import { IpaConfig, IpaSmbDomain } from 'app/interfaces/ipa-config.interface';
import { IpaConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ipa-config/ipa-config.component';

describe('IpaConfigComponent', () => {
  let spectator: Spectator<IpaConfigComponent>;
  let loader: HarnessLoader;

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

  async function getInput(name: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ name }));
  }

  async function getCheckbox(label: string): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ label }));
  }

  // TnInputHarness.setValue('') throws ("No keys have been specified"), so clear via the native control.
  function clearInput(name: string): void {
    const input = spectator.query(`input[name="${name}"]`) as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    spectator.detectChanges();
  }

  beforeEach(() => {
    spectator = createComponent({
      props: {
        ipaConfig: mockIpaConfig,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with existing IPA config', async () => {
    expect(await (await getInput('target_server')).getValue()).toBe('ipa.example.com');
    expect(await (await getInput('hostname')).getValue()).toBe('test-host');
    expect(await (await getInput('domain')).getValue()).toBe('example.com');
    expect(await (await getInput('basedn')).getValue()).toBe('dc=example,dc=com');
    expect(await (await getCheckbox('Validate Certificates')).isChecked()).toBe(true);
    expect(await (await getCheckbox('Use Default SMB Domain Configuration')).isChecked()).toBe(false);
    expect(await (await getInput('smb_domain_name')).getValue()).toBe('test-smb');
    expect(await (await getInput('smb_domain_domain_name')).getValue()).toBe('SMB.EXAMPLE.COM');
    expect(await (await getInput('smb_domain_domain_sid')).getValue())
      .toBe('S-1-5-21-1234567890-1234567890-1234567890');
    expect(await (await getInput('smb_domain_range_low')).getValue()).toBe('100000001');
    expect(await (await getInput('smb_domain_range_high')).getValue()).toBe('200000000');
  });

  it('should initialize with default SMB domain when smb_domain is null', async () => {
    const configWithoutSmbDomain = { ...mockIpaConfig, smb_domain: null as IpaSmbDomain };
    spectator.setInput('ipaConfig', configWithoutSmbDomain);
    spectator.component.ngOnInit();

    expect(await (await getCheckbox('Use Default SMB Domain Configuration')).isChecked()).toBe(true);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((nullConfigSpectator.component as any).form.value.use_default_smb_domain).toBe(true);
  });

  describe('form validation', () => {
    it('should emit isValid false when required fields are missing', () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      clearInput('target_server');
      clearInput('hostname');
      clearInput('domain');
      clearInput('basedn');

      expect(emittedValid).toBe(false);
    });

    it('should emit isValid true when required fields are filled', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await (await getInput('target_server')).setValue('ipa.test.com');
      await (await getInput('hostname')).setValue('test_host');
      await (await getInput('domain')).setValue('test.com');
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getCheckbox('Validate Certificates')).uncheck();
      await (await getCheckbox('Use Default SMB Domain Configuration')).check();

      expect(emittedValid).toBe(true);
    });
  });

  describe('SMB domain configuration', () => {
    it('should show SMB domain fields when not using default', async () => {
      await (await getCheckbox('Use Default SMB Domain Configuration')).uncheck();

      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'smb_domain_domain_name' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'smb_domain_domain_sid' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'smb_domain_range_low' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'smb_domain_range_high' }))).not.toBeNull();
    });

    it('should hide SMB domain fields when using default', async () => {
      await (await getCheckbox('Use Default SMB Domain Configuration')).check();

      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'smb_domain_domain_name' }))).toBeNull();
    });
  });

  describe('form output events', () => {
    it('should emit isValid when form validity changes', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await (await getInput('target_server')).setValue('valid-server');
      await (await getInput('hostname')).setValue('valid-host');
      await (await getInput('domain')).setValue('valid-domain');
      await (await getInput('basedn')).setValue('dc=valid,dc=com');
      await (await getCheckbox('Use Default SMB Domain Configuration')).check();

      expect(emittedValid).toBe(true);
    });

    it('should emit configurationChanged when form values change', async () => {
      let emittedConfig: IpaConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await (await getInput('target_server')).setValue('new-server');
      await (await getInput('hostname')).setValue('new-host');
      await (await getInput('domain')).setValue('new-domain');
      await (await getInput('basedn')).setValue('dc=new,dc=com');
      await (await getCheckbox('Validate Certificates')).uncheck();
      await (await getCheckbox('Use Default SMB Domain Configuration')).check();

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

      await (await getInput('target_server')).setValue('test-server');
      await (await getInput('hostname')).setValue('test-host');
      await (await getInput('domain')).setValue('test-domain');
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getCheckbox('Validate Certificates')).check();
      await (await getCheckbox('Use Default SMB Domain Configuration')).uncheck();
      await (await getInput('smb_domain_name')).setValue('test-smb');
      await (await getInput('smb_domain_domain_name')).setValue('TEST.DOMAIN.COM');
      await (await getInput('smb_domain_domain_sid')).setValue('S-1-5-21-1111111111-2222222222-3333333333');
      await (await getInput('smb_domain_range_low')).setValue('150000001');
      await (await getInput('smb_domain_range_high')).setValue('250000000');

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

      clearInput('target_server');
      clearInput('hostname');
      clearInput('domain');
      clearInput('basedn');
      await (await getCheckbox('Use Default SMB Domain Configuration')).check();

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

      clearInput('target_server');
      clearInput('hostname');
      clearInput('domain');
      clearInput('basedn');
      await (await getCheckbox('Validate Certificates')).uncheck();

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

      await (await getInput('target_server')).setValue('test-server');
      await (await getInput('hostname')).setValue('test-host');
      await (await getInput('domain')).setValue('test-domain');
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getCheckbox('Use Default SMB Domain Configuration')).uncheck();
      clearInput('smb_domain_name');
      clearInput('smb_domain_domain_name');
      clearInput('smb_domain_domain_sid');

      expect(emittedConfig.smb_domain).toEqual({
        name: null,
        range_high: 200000000,
        range_low: 100000001,
        domain_name: null,
        domain_sid: null,
        idmap_backend: IdmapBackend.Sss,
      });
    });
  });
});
