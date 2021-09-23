export interface KerberosRealm {
  admin_server: string[];
  id: number;
  kdc: string[];
  kpasswd_server: string[];
  realm: string;
}

export type KerberosRealmUpdate = Omit<KerberosRealm, 'id'>;
