import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userMenuElements = {
  hierarchy: [T('Toolbar'), T('Settings Menu')],
  synonyms: [T('Toolbar')],
  triggerAnchor: 'user-menu',
  elements: {
    userMenu: {
      anchor: 'user-menu',
    },
    changePassword: {
      hierarchy: [T('Change Password')],
    },
    guide: {
      hierarchy: [T('Guide')],
    },
    about: {
      hierarchy: [T('About')],
    },
  },
} satisfies UiSearchableElement;
