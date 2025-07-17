import {
  DirectoryServiceCredentialType,
  ActiveDirectorySchemaMode,
  LdapSchema,
  DirectoryServiceType,
  DirectoryServiceStatus,
  IdmapBackend,
} from 'app/enums/directory-services.enum';

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

export type DirectoryServiceCredential =
  | KerberosCredentialUser
  | KerberosCredentialPrincipal
  | LdapCredentialPlain
  | LdapCredentialAnonymous
  | LdapCredentialMutualTls;

export interface IdmapDomainBase {
  name: string | null;
  range_low: number;
  range_high: number;
}

export interface ActiveDirectoryIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Ad;
  schema_mode: ActiveDirectorySchemaMode;
  unix_primary_group: boolean;
  unix_nss_info: boolean;
}

export interface AutoridIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Autorid;
  rangesize: number;
  readonly: boolean;
  ignore_builtin: boolean;
}

export interface LdapIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Ldap;
  ldap_base_dn: string;
  ldap_user_dn: string;
  ldap_user_dn_password: string;
  ldap_url: string;
  readonly: boolean;
  validate_certificates: boolean;
}

export interface Rfc2307Idmap extends IdmapDomainBase {
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

export interface RidIdmap extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Rid;
  sssd_compat: boolean;
}

export interface IpaSmbDomain extends IdmapDomainBase {
  idmap_backend: IdmapBackend.Sss;
  domain_name: string | null;
  domain_sid: string | null;
}

export interface BuiltinDomainTdb extends IdmapDomainBase {
  range_low: number;
  range_high: number;
}

export type DomainIdmap = ActiveDirectoryIdmap | LdapIdmap | Rfc2307Idmap | RidIdmap;

export interface PrimaryDomainIdmap {
  builtin: BuiltinDomainTdb;
  idmap_domain: DomainIdmap;
}

export interface PrimaryDomainIdmapAutoRid {
  idmap_domain: AutoridIdmap;
}

export interface LdapMapPasswd {
  user_object_class: string | null;
  user_name: string | null;
  user_uid: string | null;
  user_gid: string | null;
  user_gecos: string | null;
  user_home_directory: string | null;
  user_shell: string | null;
}

export interface LdapMapShadow {
  shadow_last_change: string | null;
  shadow_min: string | null;
  shadow_max: string | null;
  shadow_warning: string | null;
  shadow_inactive: string | null;
  shadow_expire: string | null;
}

export interface LdapMapGroup {
  group_object_class: string | null;
  group_gid: string | null;
  group_member: string | null;
}

export interface LdapMapNetgroup {
  netgroup_object_class: string | null;
  netgroup_member: string | null;
  netgroup_triple: string | null;
}

export interface LdapAttributeMaps {
  passwd: LdapMapPasswd;
  shadow: LdapMapShadow;
  group: LdapMapGroup;
  netgroup: LdapMapNetgroup;
}

export interface LdapSearchBases {
  base_user: string | null;
  base_group: string | null;
  base_netgroup: string | null;
}

export interface ActiveDirectoryConfig {
  hostname: string;
  domain: string;
  idmap: PrimaryDomainIdmap | PrimaryDomainIdmapAutoRid;
  site: string | null;
  computer_account_ou: string | null;
  use_default_domain: boolean;
  enable_trusted_domains: boolean;
  trusted_domains: DomainIdmap[];
}

export interface LdapConfig {
  server_urls: string[];
  basedn: string;
  starttls: boolean;
  validate_certificates: boolean;
  schema: LdapSchema;
  search_bases: LdapSearchBases;
  attribute_maps: LdapAttributeMaps;
  auxiliary_parameters: string | null;
}

export interface IpaConfig {
  target_server: string;
  hostname: string;
  domain: string;
  basedn: string;
  smb_domain: IpaSmbDomain | null;
  validate_certificates: boolean;
}

export interface DirectoryServicesConfigResponse {
  id: number;
  service_type: DirectoryServiceType | null;
  credential: DirectoryServiceCredential | null;
  enable: boolean;
  enable_account_cache: boolean;
  enable_dns_updates: boolean;
  timeout: number;
  kerberos_realm: string | null;
  configuration: ActiveDirectoryConfig | IpaConfig | LdapConfig | null;
}

export interface DirectoryServicesStatus {
  type: DirectoryServiceType | null;
  status: DirectoryServiceStatus | null;
  status_msg: string | null;
}
