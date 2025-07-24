import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextDashboard = {
  activeDirectory: {
    title: T('Active Directory'),
    domainName: T('Domain Name'),
    status: T('Status'),
    statusMessage: T('Status Message'),
    domainAccountName: T('Domain Account Name'),
    accountCache: T('Account Cache'),
  },
  idmap: {
    title: T('Idmap'),
  },
  ldap: {
    title: T('LDAP'),
    status: T('Status'),
    statusMessage: T('Status Message'),
    hostname: T('Hostname'),
    baseDN: T('Base DN'),
    bindDN: T('Bind DN'),
  },
  ipa: {
    title: T('IPA'),
    status: T('Status'),
    statusMessage: T('Status Message'),
    target_server: T('Target Server'),
    hostname: T('Host Name'),
    domain: T('Domain'),
    basedn: T('Base DN'),
  },
  advancedEdit: {
    title: T('Warning'),
    message: T('Changing Advanced settings can be dangerous when done incorrectly. Please use caution before saving.'),
  },
};
