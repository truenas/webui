import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const storageCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Storage')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    storage: {
      anchor: 'storage-card',
    },
    systemPool: {
      hierarchy: [T('System Data Pool')],
    },
    swapSize: {
      hierarchy: [T('Swap Size')],
    },
  },
} satisfies UiSearchableElement;
