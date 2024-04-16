import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const viewEnclosureElements = {
  hierarchy: [T('System'), T('View Enclosure')],
  anchorRouterLink: ['/system', 'oldviewenclosure'],
  elements: {
    oldViewEnclosure: {
      synonyms: [T('Enclosure')],
    },
  },
} satisfies UiSearchableElement;
