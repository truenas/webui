import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const directoryServicesElements = {
  hierarchy: [T('Credentials'), T('Directory Services')],
  anchorRouterLink: ['/credentials', 'directory-services'],
  elements: {
    directoryServices: {},
    configureActiveDirectory: {
      hierarchy: [T('Configure Active Directory')],
      anchor: 'configure-active-directory',
    },
    configureLdap: {
      hierarchy: [T('Configure LDAP')],
      anchor: 'configure-ldap',
    },
  },
};
