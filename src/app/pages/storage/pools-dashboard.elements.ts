import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const storageElements = {
  anchorRouterLink: ['/storage'],
  hierarchy: [T('Storage')],
  elements: {
    storageDashboard: {
      anchor: 'storage-dashboard',
      synonyms: [
        T('Pools'),
        T('Storage Dashboard'),
        T('Disks'),
        T('Devices'),
        T('Datasets'),
      ],
    },
    importPool: {
      hierarchy: [T('Import Pool')],
      synonyms: [T('Add Pool')],
    },
    createPool: {
      hierarchy: [T('Create Pool')],
      synonyms: [T('Add Pool'), T('New Pool'), T('Pool Wizard'), T('Pool Creation Wizard')],
    },
  },
} satisfies UiSearchableElement;
