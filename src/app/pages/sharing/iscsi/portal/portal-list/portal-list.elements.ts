import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const portalListElements = {
  hierarchy: [T('Shares'), T('iSCSI'), T('Portals')],
  anchorRouterLink: ['/sharing', 'iscsi', 'portals'],
  elements: {
    list: {},
  },
} satisfies UiSearchableElement;
