import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sshKeypairsCardElements = {
  hierarchy: [T('Credentials'), T('SSH Keypairs')],
  anchorRouterLink: ['/credentials', 'backup-credentials'],
  elements: {
    sshKeypairs: {
      anchor: 'ssh-keypairs',
    },
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-ssh-keypair',
    },
  },
} satisfies UiSearchableElement;
