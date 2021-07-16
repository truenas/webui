import { T } from 'app/translate-marker';

export default {
  activeDirectory: {
    title: T('Active Directory'),
    domainName: T('Domain Name'),
    domainAccountName: T('Domain Account Name'),
  },
  idmap: {
    title: T('Idmap'),
  },
  ldap: {
    title: T('LDAP'),
    hostname: T('Hostname'),
    baseDN: T('Base DN'),
    bindDN: T('Bind DN'),
  },
  kerberosSettings: {
    title: T('Kerberos Settings'),
    appdefaults: T('Appdefaults Auxiliary Parameters'),
    libdefaults: T('Libdefaults Auxiliary Parameters'),
  },
  kerberosRealms: {
    title: T('Kerberos Realms'),
  },
  kerberosKeytab: {
    title: T('Kerberos Keytab'),
  },
  button: {
    settings: T('Settings'),
    add: T('Add'),
  },
};
