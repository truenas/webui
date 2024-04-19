import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const bootListElements = {
  hierarchy: [T('System'), T('Boot Environments')],
  anchorRouterLink: ['/system', 'boot'],
  elements: {
    boot: {},
  },
} satisfies UiSearchableElement;
