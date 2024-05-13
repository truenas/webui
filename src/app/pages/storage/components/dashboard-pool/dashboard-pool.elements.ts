import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dashboardPoolElements = {
  hierarchy: [T('Storage Dashboard')],
  anchorRouterLink: ['/storage'],
  elements: {
    exportDisconnect: {
      hierarchy: [T('Export/Disconnect')],
      synonyms: [T('Export'), T('Disconnect')],
    },
    expand: {
      hierarchy: [T('Expand')],
    },
  },
} satisfies UiSearchableElement;
