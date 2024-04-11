import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const storageElements = {
  anchorRouterLink: ['/storage'],
  hierarchy: [T('Storage Dashboard')],
  elements: {
    storageDashboard: {
      synonyms: [T('Pools')],
    },
    importPool: {
      hierarchy: [T('Import Pool')],
      synonyms: [T('Add Pool')],
    },
    createPool: {
      hierarchy: [T('Create Pool')],
    },
  },
} satisfies UiSearchableElement;
