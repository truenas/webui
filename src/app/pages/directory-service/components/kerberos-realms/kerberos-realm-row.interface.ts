import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';

export interface KerberosRealmRow extends KerberosRealm {
  kdc_string: string;
  admin_server_string: string;
  kpasswd_server_string: string;
}
