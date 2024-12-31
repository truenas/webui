import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dataProtectionDashboardElements = {
  hierarchy: [T('Data Protection')],
  anchorRouterLink: ['/data-protection'],
  elements: {
    dashboard: {
      anchor: 'data-protection-dashboard',
      synonyms: [T('Tasks')],
    },
  },
} satisfies UiSearchableElement;
