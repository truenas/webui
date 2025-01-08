import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const resilverConfigElements = {
  hierarchy: [T('Data Protection'), T('Scrub Tasks'), T('Resilver Priority')],
  synonyms: [T('Data Protection'), T('Scrub Tasks')],
  anchorRouterLink: ['/data-protection', 'scrub', 'priority'],
  elements: {
    priority: {
      anchor: 'scrub-priority',
    },
  },
} satisfies UiSearchableElement;
