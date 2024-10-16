import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const jobsListElements = {
  hierarchy: [T('Jobs')],
  anchorRouterLink: ['/jobs'],
  synonyms: [T('Jobs History'), T('Completed Jobs'), T('Failed Jobs'), T('Jobs in progress'), T('History')],
  elements: {
    jobs: {},
  },
} satisfies UiSearchableElement;
