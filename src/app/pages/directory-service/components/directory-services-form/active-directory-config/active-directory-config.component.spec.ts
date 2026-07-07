import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { ActiveDirectoryConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/active-directory-config.component';

describe('ActiveDirectoryConfigComponent', () => {
  let spectator: Spectator<ActiveDirectoryConfigComponent>;
  let loader: HarnessLoader;

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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(TnInputHarness.with({ name }));
  const getCheckbox = (label: string): Promise<TnCheckboxHarness> => (
    loader.getHarness(TnCheckboxHarness.with({ label }))
  );

  // TnInputHarness.setValue('') throws, so clear by mutating the native input directly.
  const clearInput = (name: string): void => {
    const input = spectator.query(`input[name="${name}"]`) as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    input.dispatchEvent(new Event('blur'));
    spectator.detectChanges();
  };

  beforeEach(() => {
    spectator = createComponent({
      props: {
        activeDirectoryConfig: mockActiveDirectoryConfig,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form with existing config values', async () => {
    expect(await (await getInput('hostname')).getValue()).toBe('test-host');
    expect(await (await getInput('domain')).getValue()).toBe('test-domain.com');
    expect(await (await getInput('site')).getValue()).toBe('test-site');
    expect(await (await getInput('computer_account_ou')).getValue()).toBe('OU=Computers,DC=test,DC=com');
    expect(await (await getCheckbox('Use Default Domain')).isChecked()).toBe(true);
  });

  it('should emit isValid false when form is invalid', () => {
    let emittedValue: boolean | undefined;
    spectator.component.isValid.subscribe((value) => {
      emittedValue = value;
    });

    clearInput('hostname');
    clearInput('domain');

    expect(emittedValue).toBe(false);
  });

  it('should emit isValid true when form is valid', async () => {
    let emittedValue: boolean | undefined;
    spectator.component.isValid.subscribe((value) => {
      emittedValue = value;
    });

    await (await getInput('hostname')).setValue('valid-host');
    await (await getInput('domain')).setValue('valid-domain.com');

    expect(emittedValue).toBe(true);
  });

  it('should emit configurationChanged when form values change', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await (await getInput('hostname')).setValue('new-host');
    await (await getInput('domain')).setValue('new-domain2.com');
    await (await getInput('site')).setValue('new-site');

    expect(emittedConfig).toEqual(expect.objectContaining({
      hostname: 'new-host',
      domain: 'new-domain2.com',
      site: 'new-site',
      computer_account_ou: 'OU=Computers,DC=test,DC=com',
      enable_trusted_domains: false,
      trusted_domains: [],
      use_default_domain: true,
    }));
  });

  it('should handle different configuration scenarios', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await (await getInput('hostname')).setValue('test-host2');
    await (await getInput('domain')).setValue('test-domain.com');
    await (await getCheckbox('Use Default Domain')).uncheck();

    expect(emittedConfig).toEqual(expect.objectContaining({
      hostname: 'test-host2',
      domain: 'test-domain.com',
      use_default_domain: false,
      computer_account_ou: 'OU=Computers,DC=test,DC=com',
      enable_trusted_domains: false,
      trusted_domains: [],
      site: 'test-site',
    }));
  });

  it('should build correct ActiveDirectoryConfig when form has valid values', async () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    await (await getInput('hostname')).setValue('build-test-host');
    await (await getInput('domain')).setValue('build-test-domain.com');
    await (await getInput('site')).setValue('build-test-site');
    await (await getInput('computer_account_ou')).setValue('OU=TestComputers,DC=build,DC=test,DC=com');
    await (await getCheckbox('Use Default Domain')).uncheck();

    expect(emittedConfig).toEqual(expect.objectContaining({
      hostname: 'build-test-host',
      domain: 'build-test-domain.com',
      site: 'build-test-site',
      computer_account_ou: 'OU=TestComputers,DC=build,DC=test,DC=com',
      use_default_domain: false,
    }));
  });

  it('should return null configuration when hostname or domain is missing', () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    clearInput('hostname');

    expect(emittedConfig).toBeNull();
  });

  it('should handle empty site and computer_account_ou values', () => {
    let emittedConfig: ActiveDirectoryConfig | null = null;
    spectator.component.configurationChanged.subscribe((config) => {
      emittedConfig = config as ActiveDirectoryConfig;
    });

    clearInput('site');
    clearInput('computer_account_ou');

    expect(emittedConfig).toEqual(expect.objectContaining({
      computer_account_ou: null,
    }));
    // Site should not be included when empty
    expect(emittedConfig).not.toHaveProperty('site');
  });

  it('should handle various form validation scenarios', async () => {
    let isValidEmitted: boolean | undefined;
    spectator.component.isValid.subscribe((valid) => {
      isValidEmitted = valid;
    });

    // Test with only hostname filled
    await (await getInput('hostname')).setValue('test-host');
    clearInput('domain');
    expect(isValidEmitted).toBe(false);

    // Test with both required fields filled
    await (await getInput('hostname')).setValue('valid-host');
    await (await getInput('domain')).setValue('valid-domain.com');
    expect(isValidEmitted).toBe(true);
  });
});
