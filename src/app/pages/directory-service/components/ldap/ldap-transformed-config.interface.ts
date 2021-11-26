import { LdapConfig } from 'app/interfaces/ldap-config.interface';

export type LdapTransformedConfig = Omit<LdapConfig, 'bindpw'> & {
  hostname_noreq: string[];
};
