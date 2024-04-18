import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const diskListElements = {
  hierarchy: [T('Storage'), T('Disks')],
  anchorRouterLink: ['/storage', 'disks'],
  elements: {
    disks: {
      synonyms: [T('Storage')],
    },
  },
} satisfies UiSearchableElement;
