import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const jobsListElements = {
  hierarchy: [T('Jobs')],
  anchorRouterLink: ['/jobs'],
  elements: {
    jobs: {},
  },
} satisfies UiSearchableElement;
