import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const initiatorFormElements = {
  hierarchy: [T('Shares'), T('Initiators'), T('Add Initiator')],
  anchorRouterLink: ['/sharing', 'iscsi', 'initiators', 'add'],
  elements: {
    addInitiator: {
      anchor: 'add-initiator',
      synonyms: [T('Initiators')],
    },
  },
} satisfies UiSearchableElement;
