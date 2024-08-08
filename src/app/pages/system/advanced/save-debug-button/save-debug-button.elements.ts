import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const saveDebugElement = {
  hierarchy: [T('System'), T('Advanced Settings')],
  anchorRouterLink: ['/system/advanced'],
  elements: {
    saveDebug: {
      hierarchy: [T('Save Debug')],
    },
  },
} satisfies UiSearchableElement;
