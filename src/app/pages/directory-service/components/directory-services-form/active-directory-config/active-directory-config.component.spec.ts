import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ActiveDirectoryConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/active-directory-config.component';

describe('ActiveDirectoryConfigComponent', () => {
  let spectator: Spectator<ActiveDirectoryConfigComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const mockActiveDirectoryConfig: ActiveDirectoryConfig = {
    hostname: 'test-host',
    domain: 'test-domain.com',
    site: 'test-site',
    computer_account_ou: 'OU=Computers,DC=test,DC=com',
    use_default_domain: true,
    enable_trusted_domains: false,
    idmap: null,
    trusted_domains: [],
  };

  const createComponent = createComponentFactory({
    component: ActiveDirectoryConfigComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        activeDirectoryConfig: mockActiveDirectoryConfig,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with existing config values', async () => {
    const values = await form.getValues();
    expect(values).toEqual(expect.objectContaining({
      'Domain Controller Hostname/IP': 'test-host',
      'Domain Name': 'test-domain.com',
      'Site Name': 'test-site',
      'Computer Account OU': 'OU=Computers,DC=test,DC=com',
      'Use Default Domain': true,
    }));
  });

  it('should emit isValid false when form is invalid', async () => {
    let emittedValue: boolean | undefined;
    spectator.component.isValid.subscribe((value) => {
      emittedValue = value;
    });

    await form.fillForm({
      'Domain Controller Hostname/IP': '',
      'Domain Name': '',
    });

    expect(emittedValue).toBe(false);
  });

  it('should emit isValid true when form is valid', async () => {
    let emittedValue: boolean | undefined;
    spectator.component.isValid.subscribe((value) => {
      emittedValue = value;
    });

    await form.fillForm({
      'Domain Controller Hostname/IP': 'valid-host',
      'Domain Name': 'valid-domain.com',
    });

    expect(emittedValue).toBe(true);
  });

  it('should emit configurationChanged when form values change', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await form.fillForm({
      'Domain Controller Hostname/IP': 'new-host',
      'Domain Name': 'new-domain2.com',
      'Site Name': 'new-site',
    });

    expect(emittedConfig).toEqual(expect.objectContaining({
      hostname: 'new-host',
      domain: 'new-domain2.com',
      site: 'new-site',
      computer_account_ou: 'OU=Computers,DC=test,DC=com',
      enable_trusted_domains: false,
      idmap: null,
      trusted_domains: [],
      use_default_domain: true,
    }));
  });

  it('should handle different configuration scenarios', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await form.fillForm({
      'Domain Controller Hostname/IP': 'test-host2',
      'Domain Name': 'test-domain.com',
      'Use Default Domain': false,
    });

    expect(emittedConfig).toEqual(expect.objectContaining({
      hostname: 'test-host2',
      domain: 'test-domain.com',
      use_default_domain: false,
      computer_account_ou: 'OU=Computers,DC=test,DC=com',
      enable_trusted_domains: false,
      trusted_domains: [],
      site: 'test-site',
      idmap: null,
    }));
  });

  it('should build correct ActiveDirectoryConfig when form has valid values', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await form.fillForm({
      'Domain Controller Hostname/IP': 'build-test-host',
      'Domain Name': 'build-test-domain.com',
      'Site Name': 'build-test-site',
      'Computer Account OU': 'OU=TestComputers,DC=build,DC=test,DC=com',
      'Use Default Domain': false,
    });

    expect(emittedConfig).toEqual(expect.objectContaining({
      hostname: 'build-test-host',
      domain: 'build-test-domain.com',
      site: 'build-test-site',
      computer_account_ou: 'OU=TestComputers,DC=build,DC=test,DC=com',
      use_default_domain: false,
    }));
  });

  it('should return null configuration when hostname or domain is missing', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await form.fillForm({
      'Domain Controller Hostname/IP': '',
      'Domain Name': 'test-domain.com',
    });

    expect(emittedConfig).toBeNull();
  });

  it('should handle empty site and computer_account_ou values', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await form.fillForm({
      'Site Name': '',
      'Computer Account OU': '',
    });

    expect(emittedConfig).toEqual(expect.objectContaining({
      site: null,
      computer_account_ou: null,
    }));
  });

  it('should handle various form validation scenarios', async () => {
    let isValidEmitted: boolean | undefined;
    spectator.component.isValid.subscribe((valid) => {
      isValidEmitted = valid;
    });

    // Test with only hostname filled
    await form.fillForm({
      'Domain Controller Hostname/IP': 'test-host',
      'Domain Name': '',
    });
    expect(isValidEmitted).toBe(false);

    // Test with both required fields filled
    await form.fillForm({
      'Domain Controller Hostname/IP': 'valid-host',
      'Domain Name': 'valid-domain.com',
    });
    expect(isValidEmitted).toBe(true);
  });
});
