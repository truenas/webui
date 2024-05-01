import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const interfacesCardElements = {
  hierarchy: [marker('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    interfaces: {
      hierarchy: [marker('Interfaces')],
    },
  },

} satisfies UiSearchableElement;
