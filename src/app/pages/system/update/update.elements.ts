import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const systemUpdateElements = {
  hierarchy: [T('System'), T('Update')],
  anchorRouterLink: ['/system', 'update'],
  elements: {
    update: {},
  },
} satisfies UiSearchableElement;
