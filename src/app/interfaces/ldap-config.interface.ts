export interface LdapConfig {
  anonbind: boolean;
  auxiliary_parameters: string;
  basedn: string;
  binddn: string;
  bindpw: string;
  cert_name: any;
  certificate: any;
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
