import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const reportingElements = {
  hierarchy: [T('Reporting')],
  synonyms: [T('Stats')],
  anchorRouterLink: ['/reportsdashboard'],
  elements: {
    reporting: {
      anchor: 'reports-dashboard',
    },
  },
} satisfies UiSearchableElement;
