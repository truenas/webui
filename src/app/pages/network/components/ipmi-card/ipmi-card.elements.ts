import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const ipmiCardElements = {
  hierarchy: [T('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    ipmi: {
      hierarchy: [T('Ipmi')],
    },
    showEvents: {
      hierarchy: [T('Show Events')],
      synonyms: [T('Show Ipmi Events')],
    },
  },
} satisfies UiSearchableElement;
