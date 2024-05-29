import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const nfsListElements = {
  hierarchy: [T('Shares'), T('NFS')],
  anchorRouterLink: ['/sharing', 'nfs'],
  elements: {
    nfs: {},
    createNfsShare: {
      hierarchy: [T('Create NFS Share')],
      synonyms: [T('Add NFS Share'), T('New NFS Share')],
    },
  },
} satisfies UiSearchableElement;
