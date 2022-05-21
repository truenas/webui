export enum IdmapName {
  DsTypeActiveDirectory = 'DS_TYPE_ACTIVEDIRECTORY',
  DsTypeLdap = 'DS_TYPE_LDAP',
  DsTypeDefaultDomain = 'DS_TYPE_DEFAULT_DOMAIN',
}

export enum IdmapBackend {
  Ad = 'AD',
  Autorid = 'AUTORID',
  Ldap = 'LDAP',
  Nss = 'NSS',
  Rfc2307 = 'RFC2307',
  Rid = 'RID',
  Tdb = 'TDB',
}

export enum IdmapSslEncryptionMode {
  Off = 'OFF',
  On = 'ON',
  StartTls = 'START_TLS',
}

export enum IdmapLinkedService {
  LocalAccount = 'LOCAL_ACCOUNT',
  Ldap = 'LDAP',
  Nis = 'NIS',
}
