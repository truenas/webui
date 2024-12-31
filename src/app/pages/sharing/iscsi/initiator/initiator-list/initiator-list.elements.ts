import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const initiatorListElements = {
  hierarchy: [T('Shares'), T('iSCSI'), T('Initiators')],
  synonyms: [T('Initiator Group')],
  anchorRouterLink: ['/sharing', 'iscsi', 'initiators'],
  elements: {
    list: {
      anchor: 'initiator-list',
    },
  },
} satisfies UiSearchableElement;
