import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const tunableListElements = {
  hierarchy: [T('System'), T('Tunables')],
  anchorRouterLink: ['/system', 'tunable'],
  elements: {
    tunables: {
      anchor: 'tunable',
    },
  },
} satisfies UiSearchableElement;
