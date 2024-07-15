import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const staticRoutesCardElements = {
  hierarchy: [T('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    staticRoutes: {
      hierarchy: [T('Static Routes')],
      synonyms: [T('Routing'), T('Static Routing')],
    },
    add: {
      hierarchy: [T('Static Routes'), T('Add Static Route')],
      synonyms: [
        T('Create Static Route'),
        T('New Static Route'),
      ],
      anchor: 'add-static-route',
    },
  },
} satisfies UiSearchableElement;
