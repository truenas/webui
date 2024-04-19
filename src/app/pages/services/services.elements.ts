import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const servicesElements = {
  hierarchy: [T('System'), T('Services')],
  anchorRouterLink: ['/system', 'services'],
  elements: {
    services: {},
  },
} satisfies UiSearchableElement;
