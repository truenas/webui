import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const directoryServicesElements = {
  hierarchy: [T('Credentials'), T('Directory Services')],
  anchorRouterLink: ['/credentials', 'directory-services'],
  elements: {
    directoryServices: {
      anchor: 'directory-services',
    },
    configureActiveDirectory: {
      hierarchy: [T('Configure Active Directory')],
      synonyms: [T('Active Directory')],
      anchor: 'configure-active-directory',
    },
    configureLdap: {
      hierarchy: [T('Configure LDAP')],
      anchor: 'configure-ldap',
    },
  },
} satisfies UiSearchableElement;
