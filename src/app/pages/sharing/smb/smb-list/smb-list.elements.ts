import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const smbListElements = {
  hierarchy: [T('Shares'), T('SMB')],
  anchorRouterLink: ['/sharing', 'smb'],
  synonyms: [T('Samba')],
  elements: {
    smbList: {
      anchor: 'smb-list',
    },
    createSmbShare: {
      hierarchy: [T('Add SMB Share')],
      synonyms:
      [
        T('Create SMB Share'),
        T('New SMB Share'),
        T('Create Share'),
        T('Add Share'),
        T('New Share'),
      ],
    },
  },
} satisfies UiSearchableElement;
