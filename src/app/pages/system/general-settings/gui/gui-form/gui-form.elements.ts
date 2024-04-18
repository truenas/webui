import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const guiFormElements = {
  hierarchy: [T('System'), T('General'), T('GUI'), T('Theme')],
  triggerAnchor: 'configure-gui',
  anchorRouterLink: ['/system', 'general'],
  elements: {
    theme: {},
  },
} satisfies UiSearchableElement;
