import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const availableAppsElements = {
  hierarchy: [T('Applications'), T('Discover')],
  anchorRouterLink: ['/apps', 'available'],
  elements: {
    available: {
      synonyms: [T('Apps'), T('Applications')],
    },
    customApp: {
      hierarchy: [T('Custom App')],
      anchor: 'custom-app',
    },
  },
} satisfies UiSearchableElement;
