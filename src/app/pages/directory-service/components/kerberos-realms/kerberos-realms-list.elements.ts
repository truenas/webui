import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kerberosRealmsListElements = {
  hierarchy: [T('Directory Services'), T('Kerberos Realms')],
  anchorRouterLink: ['/directoryservice', 'kerberosrealms'],
  elements: {
    kerberosRealms: {},
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-kerberos-realm',
      synonyms: [
        T('Add Kerberos Realm'),
        T('Create Kerberos Realm'),
        T('New Kerberos Realm'),
        T('Kerberos Realm'),
      ],
    },
  },
} satisfies UiSearchableElement;
