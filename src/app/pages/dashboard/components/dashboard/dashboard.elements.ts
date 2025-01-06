import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dashboardElements = {
  hierarchy: [T('Dashboard')],
  anchorRouterLink: ['/dashboard'],
  elements: {
    dashboard: {
      anchor: 'main-dashboard',
      synonyms: [T('Widgets')],
    },
    configure: {
      hierarchy: [T('Configure Dashboard')],
      synonyms: [
        T('Update Dashboard'),
        T('Home Widgets'),
        T('Widgets'),
        T('New Widget'),
        T('Add Widget'),
      ],
    },
  },
} satisfies UiSearchableElement;
