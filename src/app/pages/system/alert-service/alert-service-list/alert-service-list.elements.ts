import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const alertServiceListElements = {
  hierarchy: [T('System'), T('Alert Settings'), T('Alert Services')],
  anchorRouterLink: ['/system', 'alert-settings', 'services'],
  elements: {
    alertServiceList: {},
  },
} satisfies UiSearchableElement;
