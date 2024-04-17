import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const resilverConfigElements = {
  hierarchy: [T('Data Protection'), T('Scrub Tasks'), T('Resilver Priority')],
  anchorRouterLink: ['/data-protection', 'scrub', 'priority'],
  elements: {
    priority: {},
  },
} satisfies UiSearchableElement;
