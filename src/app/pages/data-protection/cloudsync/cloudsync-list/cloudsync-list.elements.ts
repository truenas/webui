import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cloudSyncListElements = {
  hierarchy: [T('Data Protection'), T('Cloud Sync Tasks')],
  anchorRouterLink: ['/data-protection', 'cloudsync'],
  elements: {
    tasks: {
      synonyms: [T('Tasks')],
    },
  },
} satisfies UiSearchableElement;
