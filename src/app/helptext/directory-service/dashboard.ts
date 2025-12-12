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
    title: T('IDMAP'),
  },
  ldap: {
    title: T('LDAP'),
    status: T('Status'),
    statusMessage: T('Status Message'),
    serverUrls: T('Server URLs'),
    baseDN: T('Base DN'),
    credentialType: T('Credential Type'),
  },
  ipa: {
    title: T('IPA'),
    status: T('Status'),
    statusMessage: T('Status Message'),
    target_server: T('Target Server'),
    domain: T('Domain'),
    basedn: T('Base DN'),
  },
  advancedEdit: {
    title: T('Warning'),
    message: T('Changing Advanced settings can be dangerous when done incorrectly. Please use caution before saving.'),
  },
  rebuildCache: {
    success: T('Directory Service cache has been rebuilt.'),
    error: T('Failed to rebuild directory service cache.'),
    errorTitle: T('Error'),
  },
};
