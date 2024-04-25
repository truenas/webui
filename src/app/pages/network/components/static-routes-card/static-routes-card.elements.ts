import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const staticRoutesCardElements = {
  hierarchy: [marker('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    staticRoutes: {
      hierarchy: [marker('Static Routes')],
    },
    add: {
      hierarchy: [marker('Static Routes'), marker('Add')],
      anchor: 'add-static-route',
    },
  },
} satisfies UiSearchableElement;
