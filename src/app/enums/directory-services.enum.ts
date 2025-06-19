export enum DirectoryServiceStatus {
  Disabled = 'DISABLED',
  Faulted = 'FAULTED',
  Leaving = 'LEAVING',
  Joining = 'JOINING',
  Healthy = 'HEALTHY',
}

export enum DirectoryServiceType {
  ActiveDirectory = 'ACTIVEDIRECTORY',
  Ipa = 'IPA',
  Ldap = 'LDAP',
}

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
