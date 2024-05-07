import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const trueCommandElements = {
  hierarchy: [T('Toolbar')],
  elements: {
    trueCommand: {
      hierarchy: [T('Status of TrueCommand')],
      synonyms: [T('TrueCommand')],
      anchor: 'tc-status',
    },
  },
} satisfies UiSearchableElement;
