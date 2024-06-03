import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const scrubTaskCardElements = {
  hierarchy: [T('Data Protection'), T('Scrub Tasks')],
  anchorRouterLink: ['/data-protection'],
  elements: {
    adjust: {
      hierarchy: [T('Adjust Scrub/Resilver Priority')],
      synonyms: [T('Adjust Scrub Priority'), T('Adjust Resilver Priority')],
    },
  },
} satisfies UiSearchableElement;
