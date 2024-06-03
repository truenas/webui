import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const interfacesCardElements = {
  hierarchy: [T('Network')],
  synonyms: [T('Networking'), T('NIC'), T('Network Interface Card')],
  anchorRouterLink: ['/network'],
  elements: {
    addInterface: {
      hierarchy: [T('Add Interface')],
      synonyms: [T('New Interface'), T('Create Interface')],
    },
    interfaces: {
      hierarchy: [T('Interfaces')],
    },
  },

} satisfies UiSearchableElement;
