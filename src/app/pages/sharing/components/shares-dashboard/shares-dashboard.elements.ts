import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sharesDashboardElements = {
  hierarchy: [T('Sharing')],
  anchorRouterLink: ['/sharing'],
  elements: {
    sharing: {
      synonyms: [T('Shares')],
    },
  },
} satisfies UiSearchableElement;
