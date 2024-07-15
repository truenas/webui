import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sshConnectionsCardElements = {
  hierarchy: [T('Credentials'), T('SSH Connections')],
  anchorRouterLink: ['/credentials', 'backup-credentials'],
  elements: {
    sshConnections: {
      anchor: 'ssh-connections',
    },
    add: {
      hierarchy: [T('Add SSH Connection')],
      synonyms: [T('New SSH Connection'), T('Create SSH Connection'), T('SSH Connection')],
      anchor: 'add-ssh-connection',
    },
  },
} satisfies UiSearchableElement;
