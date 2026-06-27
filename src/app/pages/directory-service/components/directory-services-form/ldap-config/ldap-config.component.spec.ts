import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness,
  TnChipInputHarness,
  TnInputHarness,
  TnSelectHarness,
} from '@truenas/ui-components';
import { LdapSchema } from 'app/enums/directory-services.enum';
import { LdapConfig, LdapSearchBases, LdapAttributeMaps } from 'app/interfaces/ldap-config.interface';
import { LdapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ldap-config/ldap-config.component';

describe('LdapConfigComponent', () => {
  let spectator: Spectator<LdapConfigComponent>;
  let loader: HarnessLoader;

  const mockLdapConfig: LdapConfig = {
    server_urls: ['ldap://ldap.example.com', 'ldaps://ldap2.example.com'],
    basedn: 'dc=example,dc=com',
    starttls: true,
    validate_certificates: true,
    schema: LdapSchema.Rfc2307,
    search_bases: {
      base_user: 'ou=users,dc=example,dc=com',
      base_group: 'ou=groups,dc=example,dc=com',
      base_netgroup: 'ou=netgroups,dc=example,dc=com',
    },
    attribute_maps: {
      passwd: {
        user_object_class: 'posixAccount',
        user_name: 'uid',
        user_uid: 'uidNumber',
        user_gid: 'gidNumber',
        user_gecos: 'gecos',
        user_home_directory: 'homeDirectory',
        user_shell: 'loginShell',
      },
      shadow: {
        shadow_last_change: 'shadowLastChange',
        shadow_min: 'shadowMin',
        shadow_max: 'shadowMax',
        shadow_warning: 'shadowWarning',
        shadow_inactive: 'shadowInactive',
        shadow_expire: 'shadowExpire',
      },
      group: {
        group_object_class: 'posixGroup',
        group_gid: 'gidNumber',
        group_member: 'memberUid',
      },
      netgroup: {
        netgroup_object_class: 'nisNetgroup',
        netgroup_member: 'memberNisNetgroup',
        netgroup_triple: 'nisNetgroupTriple',
      },
    },
    auxiliary_parameters: 'nss_override_attribute_value loginShell /usr/local/bin/bash',
  };

  const createComponent = createComponentFactory({
    component: LdapConfigComponent,
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

  async function getSchemaSelect(): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness);
  }

  async function getServerUrls(): Promise<TnChipInputHarness> {
    return loader.getHarness(TnChipInputHarness);
  }

  async function clearInput(name: string): Promise<void> {
    const input = await getInput(name);
    // tn-input's setValue('') throws after clearing the field; the clear itself still applies.
    await input.setValue('').catch(() => undefined);
  }

  async function setServerUrls(urls: string[]): Promise<void> {
    const chips = await getServerUrls();
    for (const chip of await chips.getChips()) {
      await chips.removeChip(chip);
    }
    for (const url of urls) {
      await chips.addChip(url);
    }
  }

  async function setCheckbox(label: string, checked: boolean): Promise<void> {
    const checkbox = await getCheckbox(label);
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  beforeEach(() => {
    spectator = createComponent({
      props: {
        ldapConfig: mockLdapConfig,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with existing LDAP config', async () => {
    expect(await (await getServerUrls()).getChips()).toEqual([
      'ldap://ldap.example.com',
      'ldaps://ldap2.example.com',
    ]);
    expect(await (await getInput('basedn')).getValue()).toBe('dc=example,dc=com');
    expect(await (await getCheckbox('Start TLS')).isChecked()).toBe(true);
    expect(await (await getCheckbox('Validate Certificates')).isChecked()).toBe(true);
    expect(await (await getSchemaSelect()).getDisplayText()).toBe(LdapSchema.Rfc2307);
    expect(await (await getCheckbox('Use Standard Search Bases')).isChecked()).toBe(false);
    expect(await (await getCheckbox('Use Standard Attribute Maps')).isChecked()).toBe(false);
    expect(await (await getCheckbox('Use Standard Auxiliary Parameters')).isChecked()).toBe(false);
  });

  it('should initialize with standard options when config has null values', async () => {
    const configWithNullValues = {
      ...mockLdapConfig,
      search_bases: null as LdapSearchBases,
      attribute_maps: null as LdapAttributeMaps,
      auxiliary_parameters: null as string,
    };
    spectator.setInput('ldapConfig', configWithNullValues);
    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(await (await getCheckbox('Use Standard Search Bases')).isChecked()).toBe(true);
    expect(await (await getCheckbox('Use Standard Attribute Maps')).isChecked()).toBe(true);
    expect(await (await getCheckbox('Use Standard Auxiliary Parameters')).isChecked()).toBe(true);
  });

  describe('form validation', () => {
    it('should require server URLs', async () => {
      let isValidEmitted: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        isValidEmitted = valid;
      });

      await setServerUrls([]);

      expect(isValidEmitted).toBe(false);
    });

    it('should require base DN', async () => {
      let isValidEmitted: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        isValidEmitted = valid;
      });

      await clearInput('basedn');

      expect(isValidEmitted).toBe(false);
    });

    it('should require schema', () => {
      let isValidEmitted: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        isValidEmitted = valid;
      });

      spectator.setInput('ldapConfig', { ...mockLdapConfig, schema: null });
      spectator.component.ngOnInit();

      expect(isValidEmitted).toBe(false);
    });

    it('should be valid with minimum required fields', async () => {
      let isValidEmitted: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        isValidEmitted = valid;
      });

      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await setCheckbox('Start TLS', false);
      await setCheckbox('Validate Certificates', false);
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);

      expect(isValidEmitted).toBe(true);
    });
  });

  describe('search bases configuration', () => {
    it('should show search bases fields when not using standard', async () => {
      await setCheckbox('Use Standard Search Bases', false);

      expect(await (await getCheckbox('Use Standard Search Bases')).isChecked()).toBe(false);
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'base_user' }))).not.toBeNull();
    });

    it('should hide search bases fields when using standard', async () => {
      await setCheckbox('Use Standard Search Bases', true);

      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);

      expect(emittedConfig).not.toHaveProperty('search_bases');
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'base_user' }))).toBeNull();
    });
  });

  describe('attribute maps configuration', () => {
    it('should show attribute maps fields when not using standard', async () => {
      await setCheckbox('Use Standard Attribute Maps', false);

      expect(await (await getCheckbox('Use Standard Attribute Maps')).isChecked()).toBe(false);
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'user_object_class' }))).not.toBeNull();
    });

    it('should hide attribute maps fields when using standard', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setCheckbox('Use Standard Attribute Maps', true);
      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);

      expect(emittedConfig).not.toHaveProperty('attribute_maps');
    });
  });

  describe('auxiliary parameters configuration', () => {
    it('should show auxiliary parameters field when not using standard', async () => {
      await setCheckbox('Use Standard Auxiliary Parameters', false);

      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'auxiliary_parameters' }))).not.toBeNull();
    });

    it('should hide auxiliary parameters field when using standard', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setCheckbox('Use Standard Auxiliary Parameters', true);
      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);

      expect(emittedConfig).not.toHaveProperty('auxiliary_parameters');
    });
  });

  describe('form output events', () => {
    it('should emit isValid when form validity changes', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await setServerUrls(['ldap://valid.com']);
      await (await getInput('basedn')).setValue('dc=valid,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);

      expect(emittedValid).toBe(true);
    });

    it('should emit configurationChanged when form values change', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setCheckbox('Use Standard Search Bases', true);
      await setCheckbox('Use Standard Attribute Maps', true);
      await setCheckbox('Use Standard Auxiliary Parameters', true);
      await setServerUrls(['ldap://new.com']);
      await (await getInput('basedn')).setValue('dc=new,dc=com');
      await setCheckbox('Start TLS', false);
      await setCheckbox('Validate Certificates', false);
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307Bis);

      // The improved config only includes non-null fields
      expect(emittedConfig).toEqual({
        server_urls: ['ldap://new.com'],
        basedn: 'dc=new,dc=com',
        starttls: false,
        validate_certificates: false,
        schema: LdapSchema.Rfc2307Bis,
      });
    });

    it('should emit configuration with custom search bases when not using standard', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await setCheckbox('Start TLS', true);
      await setCheckbox('Validate Certificates', true);
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);
      await setCheckbox('Use Standard Search Bases', false);

      await (await getInput('base_user')).setValue('ou=people,dc=test,dc=com');
      await (await getInput('base_group')).setValue('ou=groups,dc=test,dc=com');
      await (await getInput('base_netgroup')).setValue('ou=netgroups,dc=test,dc=com');

      expect(emittedConfig.search_bases).toEqual(expect.objectContaining({
        base_user: expect.any(String),
        base_group: expect.any(String),
        base_netgroup: expect.any(String),
      }));
    });

    it('should emit configuration with custom attribute maps when not using standard', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);
      await setCheckbox('Use Standard Attribute Maps', false);

      await (await getInput('user_object_class')).setValue('inetOrgPerson');
      await (await getInput('user_name')).setValue('cn');
      await (await getInput('user_uid')).setValue('employeeNumber');

      expect(emittedConfig.attribute_maps).toEqual(expect.objectContaining({
        passwd: expect.objectContaining({
          user_object_class: expect.any(String),
          user_name: expect.any(String),
          user_uid: expect.any(String),
        }),
      }));
    });

    it('should emit configuration with custom auxiliary parameters when not using standard', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);
      await setCheckbox('Use Standard Auxiliary Parameters', false);
      await (await getInput('auxiliary_parameters')).setValue('custom_parameter value');

      expect(emittedConfig.auxiliary_parameters).toBe('custom_parameter value');
    });
  });

  describe('schema options', () => {
    it('should provide RFC2307 and RFC2307bis schema options', async () => {
      const schema = await getSchemaSelect();
      await schema.open();

      expect(await schema.getOptions()).toEqual([LdapSchema.Rfc2307, LdapSchema.Rfc2307Bis]);
    });

    it('should handle schema selection changes', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307Bis);

      expect(emittedConfig?.schema).toBe(LdapSchema.Rfc2307Bis);
    });
  });

  describe('edge cases', () => {
    it('should handle empty server URLs array', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setServerUrls([]);

      expect(emittedConfig.server_urls).toEqual([]);
    });

    it('should handle null values in search bases', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);
      await setCheckbox('Use Standard Search Bases', false);

      await (await getInput('base_user')).setValue('ou=people,dc=test,dc=com');
      await (await getInput('base_group')).setValue('ou=groups,dc=test,dc=com');
      await (await getInput('base_netgroup')).setValue('ou=netgroups,dc=test,dc=com');

      expect(emittedConfig.search_bases).toEqual(expect.objectContaining({
        base_user: expect.any(String),
        base_group: expect.any(String),
        base_netgroup: expect.any(String),
      }));
    });

    it('should handle empty auxiliary parameters', async () => {
      let emittedConfig: LdapConfig | undefined;
      spectator.component.configurationChanged.subscribe((config) => {
        emittedConfig = config;
      });

      await setServerUrls(['ldap://test.com']);
      await (await getInput('basedn')).setValue('dc=test,dc=com');
      await (await getSchemaSelect()).selectOption(LdapSchema.Rfc2307);
      await setCheckbox('Use Standard Auxiliary Parameters', false);
      await clearInput('auxiliary_parameters');

      // Empty string auxiliary parameters should not be included in config
      expect(emittedConfig).not.toHaveProperty('auxiliary_parameters');
    });

    it('should handle form initialization with incomplete config', () => {
      const incompleteConfig = {
        server_urls: ['ldap://test.com'],
        basedn: 'dc=test,dc=com',
        schema: LdapSchema.Rfc2307,
        starttls: false,
        validate_certificates: false,
        search_bases: null,
        attribute_maps: null,
        auxiliary_parameters: null,
      } as LdapConfig;

      spectator.setInput('ldapConfig', incompleteConfig);
      spectator.component.ngOnInit();

      expect(spectator.component).toBeTruthy();
    });
  });
});
