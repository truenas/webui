import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sharesDashboardElements = {
  hierarchy: [T('Shares')],
  synonyms: [T('Sharing')],
  anchorRouterLink: ['/sharing'],
  elements: {
    sharing: {
      anchor: 'shares-dashboard',
      synonyms: [
        T('Shares'),
        T('Add Share'),
        T('New Share'),
        T('Create Share'),
      ],
    },
  },
} satisfies UiSearchableElement;
