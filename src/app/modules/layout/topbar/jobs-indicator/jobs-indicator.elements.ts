import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const jobsElements = {
  hierarchy: [T('Toolbar')],
  elements: {
    jobs: {
      hierarchy: [T('Jobs History')],
    },
  },
} satisfies UiSearchableElement;
