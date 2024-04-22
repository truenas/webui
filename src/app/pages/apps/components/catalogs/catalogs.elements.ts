import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const catalogsElements = {
  hierarchy: [T('Applications'), T('Discover'), T('Catalogs')],
  anchorRouterLink: ['/apps', 'available', 'catalogs'],
  elements: {
    catalogs: {},
  },
} satisfies UiSearchableElement;
