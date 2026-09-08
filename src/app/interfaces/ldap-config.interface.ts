import { LdapSchema } from 'app/enums/directory-services.enum';

export interface LdapSearchBases {
  base_user: string | null;
  base_group: string | null;
  base_netgroup: string | null;
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

export interface LdapConfig {
  server_urls: string[];
  basedn: string;
  starttls: boolean;
  validate_certificates: boolean;
  schema: LdapSchema;
  // Should be hidden under advanced options, can be left null and backend will pick the standard value
  search_bases: LdapSearchBases | null;
  // Should be hidden under advanced options, can be left null and backend will pick the standard value
  attribute_maps: LdapAttributeMaps | null;
  // Should be hidden under advanced options, can be left null and backend will pick the standard value
  auxiliary_parameters: string | null;
}
