import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const networkElements = {
  hierarchy: [T('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    network: {
      anchor: 'network-dashboard',
    },
  },
} satisfies UiSearchableElement;
