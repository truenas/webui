import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import {
  isKerberosCredentialPrincipal,
  isKerberosCredentialUser,
  isLdapCredentialAnonymous,
  isLdapCredentialMutualTls,
  isLdapCredentialPlain,
  KerberosCredentialPrincipal,
  KerberosCredentialUser,
  LdapCredentialAnonymous,
  LdapCredentialMutualTls,
  LdapCredentialPlain,
} from './directoryservice-credentials.interface';

describe('Directory Service Credential Type Guards', () => {
  describe('isLdapCredentialPlain', () => {
    it('returns true for LDAP plain credentials', () => {
      const credential: LdapCredentialPlain = {
        credential_type: DirectoryServiceCredentialType.LdapPlain,
        binddn: 'cn=admin,dc=example,dc=com',
        bindpw: 'password',
      };
      expect(isLdapCredentialPlain(credential)).toBe(true);
    });

    it('returns false for non-LDAP plain credentials', () => {
      const credential: KerberosCredentialUser = {
        credential_type: DirectoryServiceCredentialType.KerberosUser,
        username: 'user',
        password: 'password',
      };
      expect(isLdapCredentialPlain(credential)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isLdapCredentialPlain(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isLdapCredentialPlain(undefined)).toBe(false);
    });
  });

  describe('isKerberosCredentialUser', () => {
    it('returns true for Kerberos user credentials', () => {
      const credential: KerberosCredentialUser = {
        credential_type: DirectoryServiceCredentialType.KerberosUser,
        username: 'user',
        password: 'password',
      };
      expect(isKerberosCredentialUser(credential)).toBe(true);
    });

    it('returns false for non-Kerberos user credentials', () => {
      const credential: KerberosCredentialPrincipal = {
        credential_type: DirectoryServiceCredentialType.KerberosPrincipal,
        principal: 'user@EXAMPLE.COM',
      };
      expect(isKerberosCredentialUser(credential)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isKerberosCredentialUser(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isKerberosCredentialUser(undefined)).toBe(false);
    });
  });

  describe('isKerberosCredentialPrincipal', () => {
    it('returns true for Kerberos principal credentials', () => {
      const credential: KerberosCredentialPrincipal = {
        credential_type: DirectoryServiceCredentialType.KerberosPrincipal,
        principal: 'user@EXAMPLE.COM',
      };
      expect(isKerberosCredentialPrincipal(credential)).toBe(true);
    });

    it('returns false for non-Kerberos principal credentials', () => {
      const credential: KerberosCredentialUser = {
        credential_type: DirectoryServiceCredentialType.KerberosUser,
        username: 'user',
        password: 'password',
      };
      expect(isKerberosCredentialPrincipal(credential)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isKerberosCredentialPrincipal(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isKerberosCredentialPrincipal(undefined)).toBe(false);
    });
  });

  describe('isLdapCredentialAnonymous', () => {
    it('returns true for LDAP anonymous credentials', () => {
      const credential: LdapCredentialAnonymous = {
        credential_type: DirectoryServiceCredentialType.LdapAnonymous,
      };
      expect(isLdapCredentialAnonymous(credential)).toBe(true);
    });

    it('returns false for non-LDAP anonymous credentials', () => {
      const credential: LdapCredentialPlain = {
        credential_type: DirectoryServiceCredentialType.LdapPlain,
        binddn: 'cn=admin,dc=example,dc=com',
        bindpw: 'password',
      };
      expect(isLdapCredentialAnonymous(credential)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isLdapCredentialAnonymous(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isLdapCredentialAnonymous(undefined)).toBe(false);
    });
  });

  describe('isLdapCredentialMutualTls', () => {
    it('returns true for LDAP MTLS credentials', () => {
      const credential: LdapCredentialMutualTls = {
        credential_type: DirectoryServiceCredentialType.LdapMtls,
        client_certificate: 'cert-id',
      };
      expect(isLdapCredentialMutualTls(credential)).toBe(true);
    });

    it('returns false for non-LDAP MTLS credentials', () => {
      const credential: LdapCredentialAnonymous = {
        credential_type: DirectoryServiceCredentialType.LdapAnonymous,
      };
      expect(isLdapCredentialMutualTls(credential)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isLdapCredentialMutualTls(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isLdapCredentialMutualTls(undefined)).toBe(false);
    });
  });
});
