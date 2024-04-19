import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const groupListElements = {
  hierarchy: [T('Credentials'), T('Groups')],
  anchorRouterLink: ['/credentials', 'groups'],
  elements: {
    list: {},
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-group',
    },
  },
} satisfies UiSearchableElement;
