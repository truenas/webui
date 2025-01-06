import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const nfsSessionListElements = {
  hierarchy: [T('Shares'), T('NFS'), T('NFS Sessions')],
  anchorRouterLink: ['/sharing', 'nfs', 'sessions'],
  elements: {
    nfsSessions: {
      anchor: 'nfs-session-list',
    },
  },
} satisfies UiSearchableElement;
