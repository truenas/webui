import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const smbStatusElements = {
  hierarchy: [T('Shares'), T('SMB'), T('SMB Status')],
  synonyms: [T('Samba')],
  elements: {
    sessions: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'sessions'],
      hierarchy: [T('Sessions')],
      synonyms: [T('SMB Sessions')],
    },
    locks: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'locks'],
      hierarchy: [T('Locks')],
      synonyms: [T('SMB Locks')],
    },
    shares: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'shares'],
      hierarchy: [T('Shares')],
      synonyms: [T('SMB Shares')],
    },
    notifications: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'notifications'],
      hierarchy: [T('Notifications')],
      synonyms: [T('SMB Notifications')],
    },
  },
} satisfies UiSearchableElement;
