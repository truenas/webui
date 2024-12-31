import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kmipElements = {
  hierarchy: [T('Credentials'), T('KMIP')],
  anchorRouterLink: ['/credentials', 'kmip'],
  elements: {
    kmip: {
      anchor: 'kmip',
    },
  },
} satisfies UiSearchableElement;
