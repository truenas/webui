import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

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
};
