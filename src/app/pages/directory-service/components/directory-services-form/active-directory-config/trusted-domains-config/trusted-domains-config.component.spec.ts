import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { DomainIdmap } from 'app/interfaces/active-directory-config.interface';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { TrustedDomainsConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/trusted-domains-config/trusted-domains-config.component';

describe('TrustedDomainsConfigComponent', () => {
  let spectator: Spectator<TrustedDomainsConfigComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;

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

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        enableTrustedDomains: false,
        trustedDomains: [],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with enabled state', async () => {
    spectator.setInput('enableTrustedDomains', true);
    spectator.component.ngOnInit();

    expect((await form.getValues())).toEqual(expect.objectContaining({
      'Enable Trusted Domains': true,
    }));
  });

  it('should initialize with existing trusted domains', async () => {
    spectator.setInput('trustedDomains', mockTrustedDomains);
    spectator.component.ngOnInit();
    await form.fillForm({
      'Enable Trusted Domains': true,
    });

    spectator.detectChanges();
    const trustedDomainsList = await loader.getHarness(IxListHarness.with({ label: 'Trusted Domains' }));
    const trustedDomains = await trustedDomainsList.getFormValues();
    expect(trustedDomains).toEqual([
      {
        Name: 'trusted-domain-1',
        'Range Low': '100000001',
        'Range High': '200000000',
        'IDMAP Backend': 'AD (Active Directory)',
        'Schema Mode': ActiveDirectorySchemaMode.Rfc2307,
        'Unix Primary Group': true,
        'Unix NSS Info': false,
      },
      {
        Name: 'trusted-domain-2',
        'Range Low': '200000001',
        'Range High': '300000000',
        'IDMAP Backend': 'RID (Relative Identifier)',
        'SSSD Compat': true,
      },
    ]);
  });

  it('should emit trustedDomainsChanged when form values change', async () => {
    let emittedValue: [boolean, DomainIdmap[]] | undefined;
    spectator.component.trustedDomainsChanged.subscribe((value) => {
      emittedValue = value;
    });

    await form.fillForm({
      'Enable Trusted Domains': true,
    });

    expect(emittedValue).toBeDefined();
    expect(emittedValue[0]).toBe(true);
    expect(emittedValue[1]).toEqual([]);
  });

  it('should emit isValid when form validity changes', async () => {
    let emittedValid: boolean | undefined;
    spectator.component.isValid.subscribe((valid) => {
      emittedValid = valid;
    });

    await form.fillForm({
      'Enable Trusted Domains': true,
    });

    expect(emittedValid).toBe(true);
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
});
