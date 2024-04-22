import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const replicationListElements = {
  hierarchy: [T('Data Protection'), T('Replication Tasks')],
  anchorRouterLink: ['/data-protection', 'replication'],
  elements: {
    tasks: {
      synonyms: [T('Tasks')],
    },
  },
} satisfies UiSearchableElement;
