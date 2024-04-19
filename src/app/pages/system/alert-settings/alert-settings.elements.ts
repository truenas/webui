import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const alertSettingsElements = {
  hierarchy: [T('System'), T('Alert Settings')],
  anchorRouterLink: ['/system', 'alert-settings'],
  elements: {
    alertSettings: {},
  },
} satisfies UiSearchableElement;
