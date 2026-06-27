import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { PrimaryDomainIdmap } from 'app/interfaces/active-directory-config.interface';
import { IdmapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/idmap-config/idmap-config.component';

describe('IdmapConfigComponent', () => {
  let spectator: Spectator<IdmapConfigComponent>;
  let loader: HarnessLoader;

  const adBackendOption = 'AD (RFC2307/SFU attributes from Active Directory)';
  const ridBackendOption = 'RID (Default - algorithmic mapping based on RID values)';

  const mockIdmapConfig: PrimaryDomainIdmap = {
    builtin: {
      name: 'builtin_test',
      range_low: 90000001,
      range_high: 100000000,
    },
    idmap_domain: {
      name: 'test_domain',
      range_low: 100000001,
      range_high: 200000000,
      idmap_backend: IdmapBackend.Ad,
      schema_mode: ActiveDirectorySchemaMode.Rfc2307,
      unix_primary_group: true,
      unix_nss_info: false,
    },
  };

  const createComponent = createComponentFactory({
    component: IdmapConfigComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  /** The idmap_backend select is always the first select rendered. */
  async function getBackendSelect(): Promise<TnSelectHarness> {
    return (await loader.getAllHarnesses(TnSelectHarness))[0];
  }

  /** Builtin inputs render before idmap_domain inputs; index 1 targets idmap_domain. */
  async function getIdmapDomainInput(name: string): Promise<TnInputHarness> {
    const inputs = await loader.getAllHarnesses(TnInputHarness.with({ name }));
    return inputs[inputs.length - 1];
  }

  function getUseDefaultCheckbox(): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ label: 'Use TrueNAS Server IDMAP Defaults' }));
  }

  beforeEach(() => {
    spectator = createComponent({
      props: {
        idmap: mockIdmapConfig,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with existing IDMAP config', async () => {
    expect(await (await getUseDefaultCheckbox()).isChecked()).toBe(false);

    const backend = await getBackendSelect();
    expect(await backend.getDisplayText()).toBe(adBackendOption);

    expect(await (await getIdmapDomainInput('name')).getValue()).toBe('test_domain');
    expect(await (await getIdmapDomainInput('range_low')).getValue()).toBe('100000001');
    expect(await (await getIdmapDomainInput('range_high')).getValue()).toBe('200000000');
  });

  it('should initialize with default IDMAP when null is passed', async () => {
    spectator.setInput('idmap', null);
    spectator.component.ngOnInit();

    expect(await (await getUseDefaultCheckbox()).isChecked()).toBe(true);
  });

  it('should emit idmapUpdated when form values change', async () => {
    let emittedValue: [boolean, PrimaryDomainIdmap] | undefined;
    spectator.component.idmapUpdated.subscribe((value) => {
      emittedValue = value;
    });

    await (await getUseDefaultCheckbox()).uncheck();
    await (await getBackendSelect()).selectOption(ridBackendOption);
    await (await getIdmapDomainInput('name')).setValue('new-domain');
    await (await getIdmapDomainInput('range_low')).setValue('150000001');
    await (await getIdmapDomainInput('range_high')).setValue('250000000');

    expect(emittedValue).toBeDefined();
    expect(emittedValue[0]).toBe(false);
    expect(emittedValue[1]).toEqual(expect.objectContaining({
      idmap_domain: expect.objectContaining({
        idmap_backend: IdmapBackend.Rid,
        name: 'new-domain',
        range_low: 150000001,
        range_high: 250000000,
      }),
    }));
  });

  it('should emit isValid when form validity changes', async () => {
    let emittedValid: boolean | undefined;
    spectator.component.isValid.subscribe((valid) => {
      emittedValid = valid;
    });

    await (await getBackendSelect()).selectOption(adBackendOption);

    await (await getIdmapDomainInput('name')).setValue('idmap_domain');
    await (await getIdmapDomainInput('range_low')).setValue('100000002');
    await (await getIdmapDomainInput('range_high')).setValue('100000054');

    const schemaModeSelect = (await loader.getAllHarnesses(TnSelectHarness))[1];
    await schemaModeSelect.selectOption(ActiveDirectorySchemaMode.Rfc2307);

    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Unix Primary Group' }))).check();
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Unix NSS Info' }))).check();

    expect(emittedValid).toBe(true);
  });

  describe('idmap backend types', () => {
    it('should show AD specific fields when AD backend is selected', async () => {
      await (await getUseDefaultCheckbox()).uncheck();
      await (await getBackendSelect()).selectOption(adBackendOption);

      expect(await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Unix Primary Group' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Unix NSS Info' }))).not.toBeNull();
      // idmap_backend + schema_mode selects
      expect(await loader.getAllHarnesses(TnSelectHarness)).toHaveLength(2);
    });

    it('should show LDAP specific fields when LDAP backend is selected', async () => {
      await (await getUseDefaultCheckbox()).uncheck();
      await (await getBackendSelect()).selectOption('LDAP');

      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'ldap_url' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'ldap_base_dn' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'ldap_user_dn' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'ldap_user_dn_password' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Validate Certificates' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Readonly' }))).not.toBeNull();
    });

    it('should show RID specific fields when RID backend is selected', async () => {
      await (await getUseDefaultCheckbox()).uncheck();
      await (await getBackendSelect()).selectOption(ridBackendOption);

      expect(await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'SSSD Compat' }))).not.toBeNull();
    });
  });

  describe('dynamic form controls', () => {
    it('should add and remove controls based on idmap backend type', async () => {
      await (await getUseDefaultCheckbox()).uncheck();
      await (await getBackendSelect()).selectOption(adBackendOption);

      expect(await loader.getAllHarnesses(TnSelectHarness)).toHaveLength(2);

      await (await getBackendSelect()).selectOption(ridBackendOption);

      expect(await loader.getAllHarnesses(TnSelectHarness)).toHaveLength(1);
      expect(await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'SSSD Compat' }))).not.toBeNull();
    });

    it('should preserve core controls when switching backends', async () => {
      await (await getUseDefaultCheckbox()).uncheck();
      await (await getBackendSelect()).selectOption(adBackendOption);

      await (await getIdmapDomainInput('name')).setValue('test-domain');
      await (await getIdmapDomainInput('range_low')).setValue('100000001');
      await (await getIdmapDomainInput('range_high')).setValue('200000000');

      await (await getBackendSelect()).selectOption(ridBackendOption);

      expect(await (await getIdmapDomainInput('name')).getValue()).toBe('test-domain');
      expect(await (await getIdmapDomainInput('range_low')).getValue()).toBe('100000001');
      expect(await (await getIdmapDomainInput('range_high')).getValue()).toBe('200000000');
    });
  });

  describe('edge cases', () => {
    it('should handle null idmap input', async () => {
      spectator.setInput('idmap', null);
      spectator.component.ngOnInit();

      expect(await (await getUseDefaultCheckbox()).isChecked()).toBe(true);
    });

    it('should emit correct values when switching between default and custom', async () => {
      let emittedValues: [boolean, PrimaryDomainIdmap] | undefined;
      spectator.component.idmapUpdated.subscribe((value) => {
        emittedValues = value;
      });

      await (await getUseDefaultCheckbox()).check();
      expect(emittedValues[0]).toBe(true);

      await (await getUseDefaultCheckbox()).uncheck();
      expect(emittedValues[0]).toBe(false);
    });

    it('should initialize sssd_compat from API values when RID backend is used', async () => {
      const ridConfig: PrimaryDomainIdmap = {
        builtin: {
          name: 'builtin_test',
          range_low: 90000001,
          range_high: 100000000,
        },
        idmap_domain: {
          name: 'AD03',
          range_low: 100000001,
          range_high: 200000000,
          idmap_backend: IdmapBackend.Rid,
          sssd_compat: true,
        },
      };

      spectator.setInput('idmap', ridConfig);
      spectator.component.ngOnInit();

      const sssdCompatCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SSSD Compat' }));
      expect(await sssdCompatCheckbox.isChecked()).toBe(true);
    });
  });
});
