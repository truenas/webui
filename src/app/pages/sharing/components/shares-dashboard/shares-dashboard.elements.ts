import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sharesDashboardElements = {
  hierarchy: [T('Shares')],
  anchorRouterLink: ['/sharing'],
  elements: {
    sharing: {
      synonyms: [T('Shares'), T('Add Share'), T('New Share'), T('Create Share')],
    },
  },
} satisfies UiSearchableElement;
