export enum DirectoryServicesType {
  ActiveDirectory = 'ACTIVEDIRECTORY',
  Ipa = 'IPA',
  Ldap = 'LDAP',
}

export enum DirectoryServicesStatus {
  Disabled = 'DISABLED',
  Faulted = 'FAULTED',
  Leaving = 'LEAVING',
  Joining = 'JOINING',
  Healthy = 'HEALTHY',
}

export enum DirectoryServicesCredType {
  KerberosPrincipal = 'KERBEROS_PRINCIPAL',
  KerberosUser = 'KERBEROS_USER',
  LdapPlain = 'LDAP_PLAIN',
  LdapAnonymous = 'LDAP_ANONYMOUS',
  LdapMtls = 'LDAP_MTLS',
}

export enum LDAPSchema {
  Rfc2307 = 'RFC2307',
  Rfc2307Bis = 'RFC2307BIS',
}

export enum IdmapBackend {
  Ad = 'AD',
  Autorid = 'AUTORID',
  Ldap = 'LDAP',
  Rfc2307 = 'RFC2307',
  Rid = 'RID',
  Sss = 'SSS',
}

export enum SchemaMode {
  Rfc2307 = 'RFC2307',
  Sfu = 'SFU',
  Sfu20 = 'SFU20',
}

export interface DirectoryServicesCred {
  credential_type: DirectoryServicesCredType;
  principal?: string;
  username?: string;
  password?: string;
  binddn?: string;
  bindpw?: string;
  client_certificate?: string;
}

export interface IdmapDomainBase {
  name?: string;
  range_low: number;
  range_high: number;
}

export interface ADIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Ad;
  schema_mode: SchemaMode;
  unix_primary_group: boolean;
  unix_nss_info: boolean;
}

export interface AutoridIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Autorid;
  rangesize: number;
  readonly: boolean;
  ignore_builtin: boolean;
}

export interface LDAPIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Ldap;
  ldap_base_dn: string;
  ldap_user_dn: string;
  ldap_user_dn_password: string;
  ldap_url: string;
  readonly: boolean;
  validate_certificates: boolean;
}

export interface RFC2307Idmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Rfc2307;
  ldap_url: string;
  ldap_user_dn: string;
  ldap_user_dn_password: string;
  bind_path_user: string;
  bind_path_group: string;
  user_cn: boolean;
  ldap_realm: boolean;
  validate_certificates: boolean;
}

export interface RIDIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Rid;
  sssd_compat: boolean;
}

export interface IPASMBDomain extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Sss;
  domain_name?: string;
  domain_sid?: string;
}

export type BuiltinDomainTdb = IdmapDomainBase;

export type DomainIdmap = ADIdmap | LDAPIdmap | RFC2307Idmap | RIDIdmap;

export interface PrimaryDomainIdmap {
  builtin: BuiltinDomainTdb;
  idmap_domain: DomainIdmap;
}

export interface PrimaryDomainIdmapAutoRid {
  idmap_domain: AutoridIdmap;
}

export interface ActiveDirectoryConfig {
  hostname: string;
  domain: string;
  idmap: PrimaryDomainIdmap | PrimaryDomainIdmapAutoRid;
  site?: string;
  computer_account_ou?: string;
  use_default_domain: boolean;
  enable_trusted_domains: boolean;
  trusted_domains: DomainIdmap[];
}

export interface LDAPSearchBases {
  base_user?: string;
  base_group?: string;
  base_netgroup?: string;
}

export interface LDAPMapPasswd {
  user_object_class?: string;
  user_name?: string;
  user_uid?: string;
  user_gid?: string;
  user_gecos?: string;
  user_home_directory?: string;
  user_shell?: string;
}

export interface LDAPMapShadow {
  shadow_last_change?: string;
  shadow_min?: string;
  shadow_max?: string;
  shadow_warning?: string;
  shadow_inactive?: string;
  shadow_expire?: string;
}

export interface LDAPMapGroup {
  group_object_class?: string;
  group_gid?: string;
  group_member?: string;
}

export interface LDAPMapNetgroup {
  netgroup_object_class?: string;
  netgroup_member?: string;
  netgroup_triple?: string;
}

export interface LDAPAttributeMaps {
  passwd: LDAPMapPasswd;
  shadow: LDAPMapShadow;
  group: LDAPMapGroup;
  netgroup: LDAPMapNetgroup;
}

export interface LDAPConfig {
  server_urls: string[];
  basedn: string;
  starttls: boolean;
  validate_certificates: boolean;
  schema: LDAPSchema;
  search_bases: LDAPSearchBases;
  attribute_maps: LDAPAttributeMaps;
  auxiliary_parameters?: string;
}

export interface IPAConfig {
  target_server: string;
  hostname: string;
  domain: string;
  basedn: string;
  smb_domain?: IPASMBDomain;
  validate_certificates: boolean;
}

export interface DirectoryServicesEntry {
  id: number;
  service_type: DirectoryServicesType | null;
  credential: DirectoryServicesCred | null;
  enable: boolean;
  enable_account_cache: boolean;
  enable_dns_updates: boolean;
  timeout: number;
  kerberos_realm: string | null;
  configuration: ActiveDirectoryConfig | IPAConfig | LDAPConfig | null;
}
