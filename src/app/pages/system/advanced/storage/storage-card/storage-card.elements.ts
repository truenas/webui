import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const storageCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Storage')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-storage',
    },
  },
} satisfies UiSearchableElement;
