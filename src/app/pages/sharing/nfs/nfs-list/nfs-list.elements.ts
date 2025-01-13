import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const nfsListElements = {
  hierarchy: [T('Shares'), T('NFS')],
  anchorRouterLink: ['/sharing', 'nfs'],
  elements: {
    nfs: {
      anchor: 'nfs-list',
    },
    createNfsShare: {
      hierarchy: [T('Add NFS Share')],
      synonyms: [
        T('Create NFS Share'),
        T('New NFS Share'),
        T('Create Share'),
        T('Add Share'),
        T('New Share'),
      ],
    },
  },
} satisfies UiSearchableElement;
