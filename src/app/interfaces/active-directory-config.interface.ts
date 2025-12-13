import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { Option } from 'app/interfaces/option.interface';

export interface IdmapBase {
  /** Short-form name of the domain. Can't be just anything, match with regex
   * r"^(?![0-9]*$)[a-zA-Z0-9\.\-_!@#\$%^&\(\)'\{\}~]{1,15}$"" */
  name: string | null;
  /** Value must be greater or equal to 1000 and lesser or equal to 2147000000. Default is 100000001 */
  range_low: number;
  /** Value must be greater or equal to 1000 and lesser or equal to 2147000000. Default is 200000000 */
  range_high: number;
  idmap_backend: IdmapBackend;
}

export interface ActiveDirectoryIdmap extends IdmapBase {
  idmap_backend: IdmapBackend.Ad;
  schema_mode: ActiveDirectorySchemaMode;
  unix_primary_group: boolean;
  unix_nss_info: boolean;
}

export interface LdapIdmap extends IdmapBase {
  idmap_backend: IdmapBackend.Ldap;
  ldap_base_dn: string;
  ldap_user_dn: string;
  ldap_user_dn_password: string;
  ldap_url: string;
  readonly: boolean;
  validate_certificates: boolean;
}

export interface Rfc2307Idmap extends IdmapBase {
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

export interface RidIdmap extends IdmapBase {
  idmap_backend: IdmapBackend.Rid;
  sssd_compat: boolean;
}

export type DomainIdmap = ActiveDirectoryIdmap | LdapIdmap | Rfc2307Idmap | RidIdmap;

export const domainIdmapTypeOptions: Option<IdmapBackend>[] = [
  { label: T('AD (Active Directory)'), value: IdmapBackend.Ad },
  { label: T('LDAP'), value: IdmapBackend.Ldap },
  { label: T('RFC2307'), value: IdmapBackend.Rfc2307 },
  { label: T('RID (Relative Identifier)'), value: IdmapBackend.Rid },
];

export interface BuiltinDomainTdb {
  /** Short-form name of the domain. Can't be just anything, match with regex
   * r"^(?![0-9]*$)[a-zA-Z0-9\.\-_!@#\$%^&\(\)'\{\}~]{1,15}$"" */
  name: string | null;

  /** Value must be greater or equal to 1000 and lesser or equal to 2147000000. Default is 90000001. */
  range_low: number;
  /** Value must be greater or equal to 1000 and lesser or equal to 2147000000. Default is 100000000. */
  range_high: number;
}

export interface PrimaryDomainIdmap {
  builtin: BuiltinDomainTdb; // Should be filled in with defaults which can be found on api docs
  idmap_domain: DomainIdmap; // Use would choose one of the four types before providing the info
}

export interface ActiveDirectoryConfig {
  hostname: string;
  domain: string;
  // Provide TrueNAS server defaults option and leave empty, can omit if they choose to use defaults.
  // If not, only then present idmap field. AutoRid might be removed pending support conversation
  idmap: PrimaryDomainIdmap | null;
  site: string | null;
  computer_account_ou: string | null;
  use_default_domain: boolean;
  enable_trusted_domains: boolean;
  trusted_domains: DomainIdmap[]; // only present if enabled trusted_domains
}
