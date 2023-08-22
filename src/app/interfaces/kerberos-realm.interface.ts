export interface KerberosRealm {
  admin_server: string[];
  id: number;
  kdc: string[];
  kpasswd_server: string[];
  realm: string;
  kdc_string: string;
  admin_server_string: string;
  kpasswd_server_string: string;
}

export type KerberosRealmUpdate = Omit<KerberosRealm, 'id'>;
