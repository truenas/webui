import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const directoryServicesElements = {
  hierarchy: [T('Credentials'), T('Directory Services')],
  anchorRouterLink: ['/credentials', 'directory-services'],
  elements: {
    directoryServices: {
      anchor: 'directory-services',
    },
    configureDirectoryServices: {
      hierarchy: [T('Configure Directory Services')],
      synonyms: ['DS'],
      anchor: 'configure-active-directory',
    },
    settings: {
      synonyms: [T('Active Directory'), 'AD', 'LDAP', 'OpenLDAP', 'IPA', 'FreeIPA', 'DS'],
      anchor: 'settings',
    },
  },
} satisfies UiSearchableElement;
