import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const authorizedAccessListElements = {
  hierarchy: [T('Shares'), T('iSCSI'), T('Authorized Access')],
  anchorRouterLink: ['/sharing', 'iscsi', 'authorized-access'],
  elements: {
    list: {
      anchor: 'authorized-access-list',
    },
    add: {
      hierarchy: [T('Add Authorized Access')],
      synonyms: [T('New Authorized Access'), T('Create Authorized Access')],
      anchor: 'add-authorized-access',
    },
  },
} satisfies UiSearchableElement;
