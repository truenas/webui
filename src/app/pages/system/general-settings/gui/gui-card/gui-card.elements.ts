import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const guiCardElements = {
  hierarchy: [T('System'), T('General'), T('GUI')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    configure: {
      hierarchy: [T('Settings')],
      anchor: 'configure-gui',
    },
  },
} satisfies UiSearchableElement;
