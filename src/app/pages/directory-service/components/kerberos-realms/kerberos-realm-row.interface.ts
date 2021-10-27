import { Overwrite } from 'utility-types';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';

export type KerberosRealmRow = Overwrite<KerberosRealm, {
  admin_server: string;
  kdc: string;
  kpasswd_server: string;
}>;
