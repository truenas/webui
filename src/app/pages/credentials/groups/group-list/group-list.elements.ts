import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const groupListElements = {
  hierarchy: [T('Credentials'), T('Groups')],
  anchorRouterLink: ['/credentials', 'groups'],
  elements: {
    list: {
      anchor: 'groups-list',
      synonyms: [T('Local Groups')],
    },
    add: {
      hierarchy: [T('Add Group')],
      synonyms: [T('New Group'), T('Create Group'), T('Group'), T('Add Local Group')],
      anchor: 'add-group',
    },
    showBuiltIn: {
      hierarchy: [T('Show Built-in Groups')],
    },
  },
} satisfies UiSearchableElement;
