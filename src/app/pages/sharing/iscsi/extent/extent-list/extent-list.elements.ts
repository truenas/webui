import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const extentListElements = {
  hierarchy: [T('Shares'), T('iSCSI'), T('Extents')],
  anchorRouterLink: ['/sharing', 'iscsi', 'extents'],
  elements: {
    list: {
      anchor: 'extent-list',
    },
    add: {
      hierarchy: [T('Add Extent')],
      synonyms: [T('New Extent'), T('Create Extent')],
      anchor: 'add-extent',
    },
  },
} satisfies UiSearchableElement;
