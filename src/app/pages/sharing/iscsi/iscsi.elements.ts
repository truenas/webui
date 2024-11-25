import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const iscsiElements = {
  hierarchy: [T('Shares'), T('iSCSI')],
  anchorRouterLink: ['/sharing', 'iscsi'],
  elements: {
    config: {
      hierarchy: [T('Global Target Configuration')],
      anchor: 'global-configuration',
    },
  },
} satisfies UiSearchableElement;
