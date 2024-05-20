import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kerberosKeytabsListElements = {
  hierarchy: [T('Directory Services'), T('Kerberos Keytabs')],
  anchorRouterLink: ['/directoryservice', 'kerberoskeytabs'],
  elements: {
    kerberosKeytabs: {},
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-kerberos-keytab',
      synonyms: [
        T('Add Kerberos Keytab'),
        T('Create Kerberos Keytab'),
        T('New Kerberos Keytab'),
        T('Kerberos Keytab'),
      ],
    },
  },
} satisfies UiSearchableElement;
