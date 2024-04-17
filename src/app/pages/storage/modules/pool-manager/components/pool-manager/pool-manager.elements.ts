import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const poolManagerElements = {
  hierarchy: [T('Storage'), T('Pool Creation Wizard')],
  anchorRouterLink: ['/storage', 'create'],
  elements: {
    createPool: {
      synonyms: [T('Storage')],
    },
  },
} satisfies UiSearchableElement;
