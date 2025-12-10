import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { PrimaryDomainIdmap } from 'app/interfaces/active-directory-config.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { IdmapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/idmap-config/idmap-config.component';

describe('IdmapConfigComponent', () => {
  let spectator: Spectator<IdmapConfigComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;

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

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        idmap: mockIdmapConfig,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with existing idmap config', async () => {
    const values = await form.getValues();
    expect(values).toEqual(expect.objectContaining({
      'Use TrueNAS Server IDMAP Defaults': false,
      'IDMAP Backend': 'AD (Active Directory)',
      Name: 'test_domain',
      'Range Low': '100000001',
      'Range High': '200000000',
    }));
  });

  it('should initialize with default idmap when null is passed', async () => {
    spectator.setInput('idmap', null);
    spectator.component.ngOnInit();

    const values = await form.getValues();
    expect(values).toEqual(expect.objectContaining({
      'Use TrueNAS Server IDMAP Defaults': true,
    }));
  });

  it('should emit idmapUpdated when form values change', async () => {
    let emittedValue: [boolean, PrimaryDomainIdmap] | undefined;
    spectator.component.idmapUpdated.subscribe((value) => {
      emittedValue = value;
    });

    await form.fillForm({
      'Use TrueNAS Server IDMAP Defaults': false,
      'IDMAP Backend': 'RID (Relative Identifier)',
      Name: 'new-domain',
      'Range Low': 150000001,
      'Range High': 250000000,
    });

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

    const builtinFiledset = await loader.getHarness(IxFieldsetHarness.with({ title: 'Builtin' }));
    await builtinFiledset.fillForm({
      Name: 'valid_domain',
      'Range Low': 150000001,
      'Range High': 250000000,
    });

    const idmapFieldset = await loader.getHarness(IxFieldsetHarness.with({ title: 'IDMAP Domain' }));
    await idmapFieldset.fillForm({
      'IDMAP Backend': 'AD (Active Directory)',
    });
    await idmapFieldset.fillForm({
      Name: 'idmap_domain',
      'Range Low': 100000002,
      'Range High': 100000054,
      'Schema Mode': ActiveDirectorySchemaMode.Rfc2307,
      'Unix Primary Group': true,
      'Unix NSS Info': true,
    });

    expect(emittedValid).toBe(true);
  });

  describe('idmap backend types', () => {
    it('should show AD specific fields when AD backend is selected', async () => {
      await form.fillForm({
        'Use TrueNAS Server IDMAP Defaults': false,
        'IDMAP Backend': 'AD (Active Directory)',
      });

      const values = await form.getValues();
      expect(values).toEqual(expect.objectContaining({
        'Schema Mode': expect.any(String),
        'Unix Primary Group': expect.any(Boolean),
        'Unix NSS Info': expect.any(Boolean),
      }));
    });

    it('should show LDAP specific fields when LDAP backend is selected', async () => {
      await form.fillForm({
        'Use TrueNAS Server IDMAP Defaults': false,
        'IDMAP Backend': 'LDAP',
      });

      const values = await form.getValues();
      expect(values).toEqual(expect.objectContaining({
        'LDAP Url': expect.any(String),
        'LDAP User DN': expect.any(String),
        'LDAP User DN Password': expect.any(String),
        'Validate Certificates': expect.any(Boolean),
        'LDAP Base DN': expect.any(String),
        Readonly: expect.any(Boolean),
        'Use TrueNAS Server IDMAP Defaults': false,
        Name: 'test_domain',
        'Range High': '200000000',
        'Range Low': '100000001',
      }));
    });

    it('should show RID specific fields when RID backend is selected', async () => {
      await form.fillForm({
        'Use TrueNAS Server IDMAP Defaults': false,
        'IDMAP Backend': 'RID (Relative Identifier)',
      });

      const values = await form.getValues();
      expect(values).toEqual(expect.objectContaining({
        'Use TrueNAS Server IDMAP Defaults': false,
        'SSSD Compat': expect.any(Boolean),
        Name: 'test_domain',
        'Range High': '200000000',
        'Range Low': '100000001',
      }));
    });
  });

  describe('dynamic form controls', () => {
    it('should add and remove controls based on idmap backend type', async () => {
      await form.fillForm({
        'Use TrueNAS Server IDMAP Defaults': false,
        'IDMAP Backend': 'AD (Active Directory)',
      });

      let values = await form.getValues();
      expect(values).toHaveProperty('Schema Mode');

      await form.fillForm({
        'IDMAP Backend': 'RID (Relative Identifier)',
      });

      values = await form.getValues();
      expect(values).not.toHaveProperty('Schema Mode');
      expect(values).toHaveProperty('SSSD Compat');
    });

    it('should preserve core controls when switching backends', async () => {
      await form.fillForm({
        'Use TrueNAS Server IDMAP Defaults': false,
        'IDMAP Backend': 'AD (Active Directory)',
        Name: 'test-domain',
        'Range Low': 100000001,
        'Range High': 200000000,
      });

      await form.fillForm({
        'IDMAP Backend': 'RID (Relative Identifier)',
      });

      const values = await form.getValues();
      expect(values).toEqual(expect.objectContaining({
        Name: 'test-domain',
        'Range Low': '100000001',
        'Range High': '200000000',
      }));
    });
  });

  describe('edge cases', () => {
    it('should handle null idmap input', async () => {
      spectator.setInput('idmap', null);
      spectator.component.ngOnInit();

      const useDefaultCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use TrueNAS Server IDMAP Defaults' }));
      expect(await useDefaultCheckbox.getValue()).toBe(true);
    });

    it('should emit correct values when switching between default and custom', async () => {
      let emittedValues: [boolean, PrimaryDomainIdmap] | undefined;
      spectator.component.idmapUpdated.subscribe((value) => {
        emittedValues = value;
      });

      await form.fillForm({
        'Use TrueNAS Server IDMAP Defaults': true,
      });

      expect(emittedValues[0]).toBe(true);

      await form.fillForm({
        'Use TrueNAS Server IDMAP Defaults': false,
      });

      expect(emittedValues[0]).toBe(false);
    });
  });
});
