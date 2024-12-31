import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const vmwareSnapshotListElements = {
  hierarchy: [T('Data Protection'), T('VMware Snapshots')],
  anchorRouterLink: ['/data-protection', 'vmware-snapshots'],
  elements: {
    vmwareSnapshots: {
      anchor: 'vmware-snapshots',
    },
  },
} satisfies UiSearchableElement;
