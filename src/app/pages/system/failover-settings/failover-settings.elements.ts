import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const failoverElements = {
  hierarchy: [T('System'), T('Failover')],
  anchorRouterLink: ['/system', 'failover'],
  elements: {
    failover: {},
  },
} satisfies UiSearchableElement;
