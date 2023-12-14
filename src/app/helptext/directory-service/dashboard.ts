import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextDashboard = {
  activeDirectory: {
    title: T('Active Directory'),
    domainName: T('Domain Name'),
    status: T('Status'),
    domainAccountName: T('Domain Account Name'),
  },
  idmap: {
    title: T('Idmap'),
  },
  ldap: {
    title: T('LDAP'),
    status: T('Status'),
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
  advancedEdit: {
    title: T('Warning'),
    message: T('Changing Advanced settings can be dangerous when done incorrectly. Please use caution before saving.'),
  },
};
