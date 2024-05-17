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
      synonyms: [T('Add SSH Keypair'), T('New SSH Keypair'), T('Create SSH Keypair'), T('SSH Keypair')],
      anchor: 'add-ssh-keypair',
    },
  },
} satisfies UiSearchableElement;
