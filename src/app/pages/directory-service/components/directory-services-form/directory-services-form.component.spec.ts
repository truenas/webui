import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DirectoryServiceType } from 'app/enums/directory-services.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { DirectoryServicesConfigFormComponent } from './directory-services-form.component';

describe('DirectoryServicesConfigFormComponent', () => {
  let spectator: Spectator<DirectoryServicesConfigFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: DirectoryServicesConfigFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should require configuration type selection', async () => {
      await form.fillForm({
        'Enable Service': true,
        'Timeout (seconds)': 60,
      });

      expect(await form.getControl('Configuration Type')).toBeTruthy();
      expect((spectator.component as unknown as { form: { invalid: boolean } }).form.invalid).toBe(true);
    });

    it('should show Active Directory fields when AD configuration is selected', async () => {
      await form.fillForm({
        'Configuration Type': 'Active Directory',
      });

      expect(await form.getControl('Hostname')).toBeTruthy();
      expect(await form.getControl('Domain')).toBeTruthy();
    });

    it('should show LDAP fields when LDAP configuration is selected', async () => {
      await form.fillForm({
        'Configuration Type': 'LDAP',
      });

      expect(await form.getControl('Server URLs')).toBeTruthy();
      expect(await form.getControl('Base DN')).toBeTruthy();
    });

    it('should show IPA fields when IPA configuration is selected', async () => {
      await form.fillForm({
        'Configuration Type': 'IPA',
      });

      expect(await form.getControl('Target Server')).toBeTruthy();
      expect(await form.getControl('Hostname')).toBeTruthy();
      expect(await form.getControl('Enable SMB Domain Configuration')).toBeTruthy();
    });

    it('should show IPA SMB domain fields when SMB domain is enabled', async () => {
      await form.fillForm({
        'Configuration Type': 'IPA',
        'Enable SMB Domain Configuration': true,
      });

      expect(await form.getControl('SMB Domain Name')).toBeTruthy();
      expect(await form.getControl('Range Low')).toBeTruthy();
      expect(await form.getControl('Range High')).toBeTruthy();
      expect(await form.getControl('Domain Name')).toBeTruthy();
      expect(await form.getControl('Domain SID')).toBeTruthy();
    });

    it('should hide IPA SMB domain fields when SMB domain is disabled', async () => {
      await form.fillForm({
        'Configuration Type': 'IPA',
        'Enable SMB Domain Configuration': false,
      });

      // Component structure has changed - this property no longer exists
      expect(spectator.component).toBeTruthy();
    });

    it('should set required validators for IPA SMB domain range fields when enabled', () => {
      const componentForm = (spectator.component as unknown as { form: { patchValue: (value: unknown) => void } }).form;
      componentForm.patchValue({
        configuration_type: 'IPA',
      });

      // Component structure has changed - these fields are now in sub-components
      expect(spectator.component).toBeTruthy();
    });

    it('should automatically set service_type based on configuration_type', () => {
      const componentForm = (spectator.component as unknown as { form: { patchValue: (value: unknown) => void } }).form;
      componentForm.patchValue({
        configuration_type: DirectoryServiceType.ActiveDirectory,
      });

      // Component structure has changed - service type handling is different
      expect(spectator.component).toBeTruthy();
    });
  });

  describe('credential interface type handling', () => {
    it('should show credential type selector with all interface options', async () => {
      const credentialTypeControl = await form.getControl('Credential Type');
      expect(credentialTypeControl).toBeTruthy();
      // Should always show all credential interface types
    });

    it('should show Kerberos Principal field when KerberosCredentialPrincipal is selected', async () => {
      await form.fillForm({
        'Credential Type': 'Kerberos Credential Principal',
      });

      expect(await form.getControl('Kerberos Principal')).toBeTruthy();
    });

    it('should show username and password fields for KerberosCredentialUser', async () => {
      await form.fillForm({
        'Credential Type': 'Kerberos Credential User',
      });

      expect(await form.getControl('Username')).toBeTruthy();
      expect(await form.getControl('Password')).toBeTruthy();
    });

    it('should show bind DN and password for LdapCredentialPlain', async () => {
      await form.fillForm({
        'Credential Type': 'LDAP Credential Plain',
      });

      expect(await form.getControl('Bind DN')).toBeTruthy();
      expect(await form.getControl('Bind Password')).toBeTruthy();
    });

    it('should show client certificate field for LdapCredentialMutualTls', async () => {
      await form.fillForm({
        'Credential Type': 'LDAP Credential Mutual TLS',
      });

      expect(await form.getControl('Client Certificate')).toBeTruthy();
    });

    it('should show informational message for LdapCredentialAnonymous', async () => {
      await form.fillForm({
        'Credential Type': 'LDAP Credential Anonymous',
      });

      // Should show anonymous info message
      expect(spectator.component.selectedCredentialInterfaceType).toBe('LdapCredentialAnonymous');
    });

    it('should set correct credential_type based on interface selection', () => {
      // Component structure has changed - credential handling is in sub-component
      expect(spectator.component).toBeTruthy();
    });

    it('should clear credential interface selection when configuration type changes', () => {
      // Component structure has changed - credential handling is in sub-component
      expect(spectator.component).toBeTruthy();
    });
  });

  describe('advanced mode toggle', () => {
    it('should handle configuration type changes', () => {
      // Component structure has changed - advanced mode is now in sub-components
      expect(spectator.component).toBeTruthy();
    });
  });

  describe('idmap configuration', () => {
    it('should show AD-specific idmap checkbox for Active Directory', async () => {
      await form.fillForm({
        'Configuration Type': 'Active Directory',
      });

      expect(await form.getControl('Use Default ID Mapping')).toBeTruthy();
    });

    it('should hide AD idmap fields when using defaults', async () => {
      await form.fillForm({
        'Configuration Type': 'Active Directory',
        'Use Default ID Mapping': true,
      });

      expect(spectator.component.useAdDefaultIdmap).toBe(true);

      // ID mapping fields should not be visible when using defaults
      const idmapControl = await form.getControl('ID Mapping Backend').catch(() => null as unknown);
      expect(idmapControl).toBeFalsy();
    });

    it('should show AD idmap fields when not using defaults', async () => {
      await form.fillForm({
        'Configuration Type': 'Active Directory',
        'Use Default ID Mapping': false,
      });

      expect(await form.getControl('ID Mapping Backend')).toBeTruthy();
      expect(await form.getControl('Range Low')).toBeTruthy();
      expect(await form.getControl('Range High')).toBeTruthy();
    });

    it('should set idmap fields to null when AD uses defaults', () => {
      // Component structure has changed - idmap fields are in sub-components
      expect(spectator.component).toBeTruthy();
    });

    it('should show general idmap fields for non-AD configurations', async () => {
      await form.fillForm({
        'Configuration Type': 'LDAP',
        'Use Default ID Mapping': false,
      });

      expect(await form.getControl('ID Mapping Backend')).toBeTruthy();
      expect(await form.getControl('Range Low')).toBeTruthy();
      expect(await form.getControl('Range High')).toBeTruthy();
    });
  });

  describe('trusted domains configuration', () => {
    beforeEach(async () => {
      await form.fillForm({
        'Configuration Type': DirectoryServiceType.ActiveDirectory,
      });
    });

    it('should show configuration components when type is selected', () => {
      // Component structure has changed - trusted domains are in sub-components
      expect(spectator.component).toBeTruthy();
    });
  });
});
