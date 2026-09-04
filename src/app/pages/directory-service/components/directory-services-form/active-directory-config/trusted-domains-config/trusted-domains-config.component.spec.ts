import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnFormListHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { DomainIdmap } from 'app/interfaces/active-directory-config.interface';
import { TrustedDomainsConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/trusted-domains-config/trusted-domains-config.component';

describe('TrustedDomainsConfigComponent', () => {
  let spectator: Spectator<TrustedDomainsConfigComponent>;
  let loader: HarnessLoader;

  const getEnableCheckbox = (): Promise<TnCheckboxHarness> => {
    return loader.getHarness(TnCheckboxHarness.with({ label: 'Enable Trusted Domains' }));
  };

  const getList = (): Promise<TnFormListHarness> => {
    return loader.getHarness(TnFormListHarness.with({ label: 'Trusted Domains' }));
  };

  /**
   * `tn-form-field` cannot reach the control it projects, and the tn-* control harnesses have no
   * label filter — so entries are addressed positionally, by the `formControlName` attribute the
   * reactive-forms directive leaves on each control.
   */
  const getInput = (controlName: string, index = 0): Promise<TnInputHarness> => {
    return loader.getAllHarnesses(TnInputHarness.with({ selector: `[formControlName="${controlName}"]` }))
      .then((harnesses) => harnesses[index]);
  };

  const getSelect = (controlName: string, index = 0): Promise<TnSelectHarness> => {
    return loader.getAllHarnesses(TnSelectHarness.with({ selector: `[formControlName="${controlName}"]` }))
      .then((harnesses) => harnesses[index]);
  };

  const getCheckbox = (label: string, index = 0): Promise<TnCheckboxHarness> => {
    return loader.getAllHarnesses(TnCheckboxHarness.with({ label }))
      .then((harnesses) => harnesses[index]);
  };

  const mockTrustedDomains: DomainIdmap[] = [
    {
      name: 'trusted-domain-1',
      range_low: 100000001,
      range_high: 200000000,
      idmap_backend: IdmapBackend.Ad,
      schema_mode: ActiveDirectorySchemaMode.Rfc2307,
      unix_primary_group: true,
      unix_nss_info: false,
    },
    {
      name: 'trusted-domain-2',
      range_low: 200000001,
      range_high: 300000000,
      idmap_backend: IdmapBackend.Rid,
      sssd_compat: true,
    },
  ];

  const createComponent = createComponentFactory({
    component: TrustedDomainsConfigComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        enableTrustedDomains: false,
        trustedDomains: [],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with enabled state', async () => {
    spectator.setInput('enableTrustedDomains', true);
    spectator.component.ngOnInit();
    spectator.detectChanges();

    const enableCheckbox = await getEnableCheckbox();
    expect(await enableCheckbox.isChecked()).toBe(true);
  });

  it('should initialize with existing trusted domains', async () => {
    spectator.setInput('trustedDomains', mockTrustedDomains);
    spectator.component.ngOnInit();
    spectator.detectChanges();
    await (await getEnableCheckbox()).check();

    spectator.detectChanges();
    expect(await (await getList()).getItemCount()).toBe(2);

    expect(await (await getSelect('idmap_backend', 0)).getDisplayText())
      .toBe('AD (RFC2307/SFU attributes from Active Directory)');
    expect(await (await getInput('name', 0)).getValue()).toBe('trusted-domain-1');
    expect(await (await getInput('range_low', 0)).getValue()).toBe('100000001');
    expect(await (await getInput('range_high', 0)).getValue()).toBe('200000000');
    expect(await (await getSelect('schema_mode')).getDisplayText()).toBe(ActiveDirectorySchemaMode.Rfc2307);
    expect(await (await getCheckbox('Unix Primary Group')).isChecked()).toBe(true);
    expect(await (await getCheckbox('Unix NSS Info')).isChecked()).toBe(false);

    expect(await (await getSelect('idmap_backend', 1)).getDisplayText())
      .toBe('RID (Default - algorithmic mapping based on RID values)');
    expect(await (await getInput('name', 1)).getValue()).toBe('trusted-domain-2');
    expect(await (await getInput('range_low', 1)).getValue()).toBe('200000001');
    expect(await (await getInput('range_high', 1)).getValue()).toBe('300000000');
    expect(await (await getCheckbox('SSSD Compat')).isChecked()).toBe(true);
  });

  it('should emit trustedDomainsChanged when form values change', async () => {
    let emittedValue: [boolean, DomainIdmap[]] | undefined;
    spectator.component.trustedDomainsChanged.subscribe((value) => {
      emittedValue = value;
    });

    await (await getEnableCheckbox()).check();

    expect(emittedValue).toBeDefined();
    expect(emittedValue[0]).toBe(true);
    expect(emittedValue[1]).toEqual([]);
  });

  it('should emit isValid when form validity changes', async () => {
    let emittedValid: boolean | undefined;
    spectator.component.isValid.subscribe((valid) => {
      emittedValid = valid;
    });

    await (await getEnableCheckbox()).check();

    expect(emittedValid).toBe(true);
  });

  it('removes a trusted domain', async () => {
    spectator.setInput('trustedDomains', mockTrustedDomains);
    spectator.component.ngOnInit();
    spectator.detectChanges();
    await (await getEnableCheckbox()).check();
    spectator.detectChanges();

    const items = await (await getList()).getItems();
    await items[0].remove();
    spectator.detectChanges();

    expect(await (await getList()).getItemCount()).toBe(1);
    expect(await (await getInput('name', 0)).getValue()).toBe('trusted-domain-2');
  });

  describe('edge cases', () => {
    it('should handle empty trusted domains array', () => {
      let emittedValue: [boolean, DomainIdmap[]] | undefined;
      spectator.component.trustedDomainsChanged.subscribe((value) => {
        emittedValue = value;
      });
      spectator.setInput('trustedDomains', []);
      spectator.component.ngOnInit();

      expect(emittedValue[1]).toEqual([]);
    });

    it('should handle null trusted domains', () => {
      let emittedValue: [boolean, DomainIdmap[]] | undefined;
      spectator.component.trustedDomainsChanged.subscribe((value) => {
        emittedValue = value;
      });
      spectator.setInput('trustedDomains', null);
      spectator.component.ngOnInit();

      expect(emittedValue[1]).toEqual([]);
    });
  });

  describe('dynamic validation based on backend', () => {
    const addDomain = async (backendLabel: string): Promise<void> => {
      await (await getEnableCheckbox()).check();
      spectator.detectChanges();

      await (await getList()).add();
      spectator.detectChanges();

      await (await getSelect('idmap_backend')).selectOption(backendLabel);
      spectator.detectChanges();

      await (await getInput('name')).setValue('test-domain');
      await (await getInput('range_low')).setValue('100000');
      await (await getInput('range_high')).setValue('200000');
    };

    it('should be valid with RID backend when only base fields are filled', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await addDomain('RID (Default - algorithmic mapping based on RID values)');

      expect(emittedValid).toBe(true);
    });

    it('should be valid with AD backend when base fields and schema_mode are filled', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await addDomain('AD (RFC2307/SFU attributes from Active Directory)');
      await (await getSelect('schema_mode')).selectOption(ActiveDirectorySchemaMode.Rfc2307);

      expect(emittedValid).toBe(true);
    });

    it('should be invalid with AD backend when schema_mode is not filled', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await addDomain('AD (RFC2307/SFU attributes from Active Directory)');

      expect(emittedValid).toBe(false);
    });

    it('should update validators when backend is changed from AD to RID', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      // First select AD backend without schema_mode - should be invalid
      await addDomain('AD (RFC2307/SFU attributes from Active Directory)');

      expect(emittedValid).toBe(false);

      // Now switch to RID backend - should become valid since schema_mode is no longer required
      await (await getSelect('idmap_backend')).selectOption('RID (Default - algorithmic mapping based on RID values)');

      expect(emittedValid).toBe(true);
    });
  });
});
