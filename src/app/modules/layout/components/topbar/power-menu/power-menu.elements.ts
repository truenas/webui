import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const powerMenuElements = {
  hierarchy: [T('Toolbar'), T('Power Menu')],
  synonyms: [T('Toolbar')],
  triggerAnchor: 'power-menu',
  elements: {
    powerMenu: {
      anchor: 'power-menu',
    },
    logOut: {
      hierarchy: [T('Log Out')],
    },
    restart: {
      hierarchy: [T('Restart')],
    },
    shutDown: {
      hierarchy: [T('Shut Down')],
    },
  },
} satisfies UiSearchableElement;
