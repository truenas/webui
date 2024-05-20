import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const guiCardElements = {
  hierarchy: [T('System'), T('General'), T('GUI')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    gui: {
      anchor: 'gui-card',
    },
    theme: {
      hierarchy: [T('Theme')],
    },
  },
} satisfies UiSearchableElement;
