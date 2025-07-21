import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum DirectoryServiceStatus {
  Disabled = 'DISABLED',
  Faulted = 'FAULTED',
  Leaving = 'LEAVING',
  Joining = 'JOINING',
  Healthy = 'HEALTHY',
}

export const directoryServiceStateLabels = new Map<DirectoryServiceStatus, string>([
  [DirectoryServiceStatus.Disabled, T('Disabled')],
  [DirectoryServiceStatus.Healthy, T('Healthy')],
  [DirectoryServiceStatus.Faulted, T('Faulted')],
  [DirectoryServiceStatus.Leaving, T('Leaving')],
  [DirectoryServiceStatus.Joining, T('Joining')],
]);

export enum DirectoryServiceType {
  ActiveDirectory = 'ACTIVEDIRECTORY',
  Ipa = 'IPA',
  Ldap = 'LDAP',
}

export const directoryServiceNames = {
  [DirectoryServiceType.ActiveDirectory]: 'Active Directory',
  [DirectoryServiceType.Ipa]: 'IPA',
  [DirectoryServiceType.Ldap]: 'LDAP',
};

export enum DirectoryServiceCredentialType {
  KerberosPrincipal = 'KERBEROS_PRINCIPAL',
  KerberosUser = 'KERBEROS_USER',
  LdapPlain = 'LDAP_PLAIN',
  LdapAnonymous = 'LDAP_ANONYMOUS',
  LdapMtls = 'LDAP_MTLS',
}

export enum IdmapBackend {
  Ad = 'AD',
  Autorid = 'AUTORID',
  Ldap = 'LDAP',
  Rfc2307 = 'RFC2307',
  Rid = 'RID',
  Sss = 'SSS',
}

export enum LdapSchema {
  Rfc2307 = 'RFC2307',
  Rfc2307Bis = 'RFC2307BIS',
}

export enum ActiveDirectorySchemaMode {
  Rfc2307 = 'RFC2307',
  Sfu = 'SFU',
  Sfu20 = 'SFU20',
}
