import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const eulaElements = {
  hierarchy: [T('System'), T('Support'), T('Eula')],
  anchorRouterLink: ['/system', 'support', 'eula'],
  elements: {
    eula: {
      anchor: 'eula',
    },
  },
} satisfies UiSearchableElement;
