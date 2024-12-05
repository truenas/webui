import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const targetListElements = {
  hierarchy: [T('Shares'), T('iSCSI'), T('Targets')],
  anchorRouterLink: ['/sharing', 'iscsi', 'targets'],
  elements: {
    list: {},
  },
} satisfies UiSearchableElement;
