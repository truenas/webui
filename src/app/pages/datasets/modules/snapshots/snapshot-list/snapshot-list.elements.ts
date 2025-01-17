import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const snapshotListElements = {
  hierarchy: [T('Data Protection'), T('Snapshots')],
  anchorRouterLink: ['/datasets', 'snapshots'],
  elements: {
    list: {
      anchor: 'snapshots',
    },
    add: {
      hierarchy: ['Add'],
      synonyms: ['Create Snapshot', 'Take Snapshot', 'New Snapshot'],
      anchor: 'add-snapshot',
    },
  },
} satisfies UiSearchableElement;
