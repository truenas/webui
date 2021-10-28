import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';

export interface KerberosRealmRow extends KerberosRealm {
  admin_server_string: string;
  kdc_string: string;
  kpasswd_server_string: string;
}
