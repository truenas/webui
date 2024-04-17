import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const ldapElements = {
  hierarchy: [T('Directory Services'), T('LDAP')],
  anchorRouterLink: ['/directoryservice', 'ldap'],
  elements: {
    ldap: {},
  },
} satisfies UiSearchableElement;
