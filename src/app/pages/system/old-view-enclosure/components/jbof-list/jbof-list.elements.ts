import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const jbofListElements = {
  hierarchy: [T('System'), T('View Enclosure'), T('NVMe-oF Expansion Shelves')],
  anchorRouterLink: ['/system', 'oldviewenclosure', 'jbof'],
  elements: {
    jbof: {},
  },
} satisfies UiSearchableElement;
