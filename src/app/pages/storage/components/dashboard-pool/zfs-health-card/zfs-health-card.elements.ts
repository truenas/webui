import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const zfsHealthCardElements = {
  hierarchy: [T('Storage')],
  anchorRouterLink: ['/storage'],
  elements: {
    zfsHealth: {
      hierarchy: [T('ZFS Health')],
    },
    scrub: {
      hierarchy: [T('Scrub')],
    },
    autoTrim: {
      hierarchy: [T('Auto TRIM')],
      synonyms: [T('Edit Trim'), T('Edit Auto TRIM')],
    },
  },
} satisfies UiSearchableElement;
