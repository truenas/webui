import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { Option } from 'app/interfaces/option.interface';

export interface KerberosCredentialPrincipal {
  credential_type: DirectoryServiceCredentialType.KerberosPrincipal;
  principal: string;
}

export interface KerberosCredentialUser {
  credential_type: DirectoryServiceCredentialType.KerberosUser;
  username: string;
  password: string;
}

export interface LdapCredentialPlain {
  credential_type: DirectoryServiceCredentialType.LdapPlain;
  binddn: string;
  bindpw: string;
}

export interface LdapCredentialAnonymous {
  credential_type: DirectoryServiceCredentialType.LdapAnonymous;
}

export interface LdapCredentialMutualTls {
  credential_type: DirectoryServiceCredentialType.LdapMtls;
  client_certificate: string;
}
export const credentialTypeLabels: { [key in DirectoryServiceCredentialType]: string } = {
  [DirectoryServiceCredentialType.KerberosPrincipal]: T('Kerberos Principal'),
  [DirectoryServiceCredentialType.KerberosUser]: T('Kerberos User'),
  [DirectoryServiceCredentialType.LdapPlain]: T('LDAP Plain'),
  [DirectoryServiceCredentialType.LdapMtls]: T('LDAP MTLS'),
  [DirectoryServiceCredentialType.LdapAnonymous]: T('LDAP Anonymous'),
};

export const adAndIpaSupportedCredentialTypes: Option<DirectoryServiceCredentialType>[] = [
  {
    label: credentialTypeLabels[DirectoryServiceCredentialType.KerberosUser],
    value: DirectoryServiceCredentialType.KerberosUser,
  },
  {
    label: credentialTypeLabels[DirectoryServiceCredentialType.KerberosPrincipal],
    value: DirectoryServiceCredentialType.KerberosPrincipal,
  },
];

export const ldapSupportedCredentialTypes: Option<DirectoryServiceCredentialType>[] = [
  {
    label: credentialTypeLabels[DirectoryServiceCredentialType.LdapPlain],
    value: DirectoryServiceCredentialType.LdapPlain,
  },
  {
    label: credentialTypeLabels[DirectoryServiceCredentialType.LdapAnonymous],
    value: DirectoryServiceCredentialType.LdapAnonymous,
  },
  {
    label: credentialTypeLabels[DirectoryServiceCredentialType.LdapMtls],
    value: DirectoryServiceCredentialType.LdapMtls,
  },
  {
    label: credentialTypeLabels[DirectoryServiceCredentialType.KerberosPrincipal],
    value: DirectoryServiceCredentialType.KerberosPrincipal,
  },
  {
    label: credentialTypeLabels[DirectoryServiceCredentialType.KerberosUser],
    value: DirectoryServiceCredentialType.KerberosUser,
  },
];

export type DirectoryServiceCredential =
  | KerberosCredentialUser
  | KerberosCredentialPrincipal // Provide options from kerberos.keytab.kerberos_principal_choices
  | LdapCredentialPlain
  | LdapCredentialAnonymous
  | LdapCredentialMutualTls; // Provide options from a new endpoint
