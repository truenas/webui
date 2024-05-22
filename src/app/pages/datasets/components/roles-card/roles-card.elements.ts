import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const rolesCardElements = {
  hierarchy: [T('Datasets')],
  anchorRouterLink: ['/datasets'],
  elements: {
    createSmbShare: {
      hierarchy: [T('Create SMB Share')],
      synonyms: [T('Create Windows Share')],
    },
    createNfsShare: {
      hierarchy: [T('Create NFS Share')],
      synonyms: [T('Create Unix Share')],
    },
  },
} satisfies UiSearchableElement;
