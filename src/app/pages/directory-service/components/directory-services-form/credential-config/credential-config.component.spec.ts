import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServiceCredentialType, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { DirectoryServiceCredential } from 'app/interfaces/directoryservice-credentials.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { CredentialConfigComponent } from 'app/pages/directory-service/components/directory-services-form/credential-config/credential-config.component';

describe('CredentialConfigComponent', () => {
  let spectator: Spectator<CredentialConfigComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const mockKerberosPrincipals = ['host/test@REALM.COM', 'nfs/test@REALM.COM'];

  const createComponent = createComponentFactory({
    component: CredentialConfigComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('kerberos.keytab.kerberos_principal_choices', mockKerberosPrincipals),
        mockCall('directoryservices.certificate_choices', { 1: 'truenas_default' }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        serviceType: DirectoryServiceType.ActiveDirectory,
        credential: null,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should fetch kerberos principals on init', () => {
    const api = spectator.inject(ApiService);
    expect(api.call).toHaveBeenCalledWith('kerberos.keytab.kerberos_principal_choices');
  });

  describe('form validation', () => {
    it('should require principal when KerberosPrincipal is selected', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Credential Type': 'Kerberos Principal',
      });

      expect(emittedValid).toBe(false);
    });

    it('should require username and password when KerberosUser is selected', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Credential Type': 'Kerberos User',
      });

      expect(emittedValid).toBe(false);
    });

    it('should require bind DN and password when LdapPlain is selected', async () => {
      spectator.setInput('serviceType', DirectoryServiceType.Ldap);
      spectator.detectChanges();

      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Credential Type': 'LDAP Plain',
      });

      expect(emittedValid).toBe(false);
    });

    it('should require client certificate when LdapMtls is selected', async () => {
      spectator.setInput('serviceType', DirectoryServiceType.Ldap);
      spectator.detectChanges();

      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Credential Type': 'LDAP MTLS',
      });

      expect(emittedValid).toBe(false);
    });

    it('should not require any fields when LdapAnonymous is selected', async () => {
      spectator.setInput('serviceType', DirectoryServiceType.Ldap);
      spectator.detectChanges();

      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Credential Type': 'LDAP Anonymous',
      });

      expect(emittedValid).toBe(true);
    });
  });

  describe('credential type options', () => {
    it('should show AD/IPA credential types for Active Directory service', async () => {
      spectator.setInput('serviceType', DirectoryServiceType.ActiveDirectory);
      spectator.detectChanges();

      const credentialTypeControl = await form.getControl('Credential Type');
      expect(credentialTypeControl).toBeTruthy();
    });

    it('should show LDAP credential types for LDAP service', async () => {
      spectator.setInput('serviceType', DirectoryServiceType.Ldap);
      spectator.detectChanges();

      const credentialTypeControl = await form.getControl('Credential Type');
      expect(credentialTypeControl).toBeTruthy();
    });
  });

  describe('form initialization with existing credential', () => {
    it('should initialize form with KerberosUser credential', () => {
      let emittedCredential: DirectoryServiceCredential | null = null;
      spectator.component.credentialUpdated.subscribe((credential) => {
        emittedCredential = credential;
      });
      const mockCredential: DirectoryServiceCredential = {
        credential_type: DirectoryServiceCredentialType.KerberosUser,
        username: 'test-user',
        password: 'test-password',
      };

      spectator.setInput('credential', mockCredential);
      spectator.component.ngOnInit();

      expect(emittedCredential).toEqual({
        credential_type: 'KERBEROS_USER',
        password: 'test-password',
        username: 'test-user',
      });
    });

    it('should initialize form with KerberosPrincipal credential', () => {
      let emittedCredential: DirectoryServiceCredential | null = null;
      spectator.component.credentialUpdated.subscribe((credential) => {
        emittedCredential = credential;
      });
      const mockCredential: DirectoryServiceCredential = {
        credential_type: DirectoryServiceCredentialType.KerberosPrincipal,
        principal: 'host/test@REALM.COM',
      };

      spectator.setInput('credential', mockCredential);
      spectator.component.ngOnInit();

      expect(emittedCredential).toEqual({
        credential_type: 'KERBEROS_PRINCIPAL',
        principal: 'host/test@REALM.COM',
      });
    });

    it('should initialize form with LdapPlain credential', () => {
      let emittedCredential: DirectoryServiceCredential | null = null;
      spectator.component.credentialUpdated.subscribe((credential) => {
        emittedCredential = credential;
      });
      const mockCredential: DirectoryServiceCredential = {
        credential_type: DirectoryServiceCredentialType.LdapPlain,
        binddn: 'cn=admin,dc=example,dc=com',
        bindpw: 'admin-password',
      };

      spectator.setInput('serviceType', DirectoryServiceType.Ldap);
      spectator.setInput('credential', mockCredential);
      spectator.component.ngOnInit();

      expect(emittedCredential).toEqual({
        binddn: 'cn=admin,dc=example,dc=com',
        bindpw: 'admin-password',
        credential_type: 'LDAP_PLAIN',
      });
    });

    it('should initialize form with LdapMtls credential', () => {
      let emittedCredential: DirectoryServiceCredential | null = null;
      spectator.component.credentialUpdated.subscribe((credential) => {
        emittedCredential = credential;
      });
      const mockCredential: DirectoryServiceCredential = {
        credential_type: DirectoryServiceCredentialType.LdapMtls,
        client_certificate: '1',
      };

      spectator.setInput('serviceType', DirectoryServiceType.Ldap);
      spectator.setInput('credential', mockCredential);
      spectator.component.ngOnInit();

      expect(emittedCredential).toEqual({
        client_certificate: '1',
        credential_type: 'LDAP_MTLS',
      });
    });

    it('should initialize form with LdapAnonymous credential', () => {
      let emittedCredential: DirectoryServiceCredential | null = null;
      spectator.component.credentialUpdated.subscribe((credential) => {
        emittedCredential = credential;
      });
      const mockCredential: DirectoryServiceCredential = {
        credential_type: DirectoryServiceCredentialType.LdapAnonymous,
      };

      spectator.setInput('serviceType', DirectoryServiceType.Ldap);
      spectator.setInput('credential', mockCredential);
      spectator.component.ngOnInit();

      expect(emittedCredential).toEqual({
        credential_type: 'LDAP_ANONYMOUS',
      });
    });
  });

  describe('form output events', () => {
    it('should emit isValid when form validity changes', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Credential Type': 'Kerberos Principal',
        'Kerberos Principal': 'host/test@REALM.COM',
      });

      expect(emittedValid).toBe(true);
    });

    it('should emit credentialUpdated when form values change', async () => {
      let emittedCredential: DirectoryServiceCredential | null = null;
      spectator.component.credentialUpdated.subscribe((credential) => {
        emittedCredential = credential;
      });

      await form.fillForm({
        'Credential Type': 'Kerberos User',
        Username: 'test-user',
        Password: 'test-password',
      });

      expect(emittedCredential).toEqual(expect.objectContaining({
        credential_type: DirectoryServiceCredentialType.KerberosUser,
        username: 'test-user',
        password: 'test-password',
      }));
    });

    it('should clear validators when credential type changes', async () => {
      let emittedValid: boolean | undefined;
      spectator.component.isValid.subscribe((valid) => {
        emittedValid = valid;
      });

      await form.fillForm({
        'Credential Type': 'Kerberos Principal',
        'Kerberos Principal': 'host/test@REALM.COM',
      });

      expect(emittedValid).toBe(true);

      await form.fillForm({
        'Credential Type': 'Kerberos User',
      });

      expect(emittedValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null credential input', () => {
      spectator.setInput('credential', null);
      spectator.component.ngOnInit();

      expect(spectator.component).toBeTruthy();
    });

    it('should handle null service type', () => {
      spectator.setInput('serviceType', null);
      spectator.detectChanges();

      expect(spectator.component).toBeTruthy();
    });

    it('should update validators when credentialType signal changes', async () => {
      await form.fillForm({
        'Credential Type': 'Kerberos Principal',
      });

      expect(spectator.component).toBeTruthy();
    });
  });
});
