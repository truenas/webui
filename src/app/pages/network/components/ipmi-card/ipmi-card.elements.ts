import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const ipmiCardElements = {
  hierarchy: [marker('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    ipmi: {
      hierarchy: [marker('Ipmi')],
    },
  },
} satisfies UiSearchableElement;
