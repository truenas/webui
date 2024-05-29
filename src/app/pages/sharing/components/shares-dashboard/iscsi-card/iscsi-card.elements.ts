import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const iscsiCardElements = {
  hierarchy: [T('Shares')],
  anchorRouterLink: ['/sharing'],
  elements: {
    wizard: {
      hierarchy: [T('iSCSI Wizard')],
    },
    configure: {
      hierarchy: [T('Configure iSCSI')],
    },
  },
} satisfies UiSearchableElement;
