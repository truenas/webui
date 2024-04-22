import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const nfsListElements = {
  hierarchy: [T('Sharing'), T('NFS')],
  anchorRouterLink: ['/sharing', 'nfs'],
  elements: {
    nfs: {},
  },
} satisfies UiSearchableElement;
