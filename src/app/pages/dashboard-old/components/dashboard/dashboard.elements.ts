import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dashboardElements = {
  hierarchy: [T('Dashboard')],
  anchorRouterLink: ['/dashboard'],
  elements: {
    dashboard: {
      synonyms: [T('Widgets')],
    },
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-dashboard',
    },
  },
} satisfies UiSearchableElement;
