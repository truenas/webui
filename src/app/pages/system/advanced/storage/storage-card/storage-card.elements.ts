import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const storageCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Storage')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    storage: {
      synonyms: [T('Disks'), T('Pools')],
      anchor: 'storage-card',
    },
    configure: {
      anchor: 'storage-settings',
      hierarchy: [T('Configure Storage')],
      synonyms: [T('Storage Settings')],
    },
    systemPool: {
      hierarchy: [T('System Data Pool')],
    },
  },
} satisfies UiSearchableElement;
