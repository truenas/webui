export interface LdapConfig {
  anonbind: boolean;
  auxiliary_parameters: string;
  basedn: string;
  binddn: string;
  bindpw: string;
  cert_name: string;
  certificate: number;
  disable_freenas_cache: boolean;
  dns_timeout: number;
  enable: boolean;
  has_samba_schema: boolean;
  hostname: string[];
  id: number;
  kerberos_principal: string;
  kerberos_realm: number;
  schema: string;
  ssl: string;
  timeout: number;
  uri_list: string[];
  validate_certificates: boolean;
}

export interface LdapConfigUpdateResult extends LdapConfig {
  job_id: number;
}

export type LdapConfigUpdate = Omit<LdapConfig, 'id' | 'cert_name' | 'uri_list'>;
