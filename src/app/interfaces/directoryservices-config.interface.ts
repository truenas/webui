import {
  LdapSchema,
  DirectoryServiceType,
  DirectoryServiceStatus,
} from 'app/enums/directory-services.enum';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServiceCredential } from 'app/interfaces/directoryservice-credentials.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';

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

export interface LdapConfig {
  server_urls: string[];
  basedn: string;
  starttls: boolean;
  validate_certificates: boolean;
  schema: LdapSchema;
  // Should be hidden under advanced options, can be left null and backend will pick the standard value
  search_bases: LdapSearchBases;
  // Should be hidden under advanced options, can be left null and backend will pick the standard value
  attribute_maps: LdapAttributeMaps;
  // Should be hidden under advanced options, can be left null and backend will pick the standard value
  auxiliary_parameters: string | null;
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
