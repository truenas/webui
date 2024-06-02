import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const snapshotTaskCardElements = {
  hierarchy: [T('Data Protection'), T('Periodic Snapshot Tasks')],
  anchorRouterLink: ['/data-protection'],
  elements: {
    vmwareSnapshots: {
      hierarchy: [T('VMware Snapshot Integration')],
      synonyms: [T('Integrate Snapshots with VMware')],
    },
  },
} satisfies UiSearchableElement;
