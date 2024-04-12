import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const smbStatusElements = {
  hierarchy: [T('Sharing'), T('SMB'), T('SMB Status')],
  elements: {
    sessions: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'sessions'],
      hierarchy: [T('Sessions')],
    },
    locks: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'locks'],
      hierarchy: [T('Locks')],
    },
    shares: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'shares'],
      hierarchy: [T('Shares')],
    },
    notifications: {
      anchorRouterLink: ['/sharing', 'smb', 'status', 'notifications'],
      hierarchy: [T('Notifications')],
    },
  },
};
