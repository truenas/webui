import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sshKeypairsCardElements = {
  hierarchy: [T('Credentials'), T('SSH Keypairs')],
  anchorRouterLink: ['/credentials', 'backup-credentials'],
  elements: {
    sshKeypairs: {
      synonyms: [T('Keypairs'), T('Public Key'), T('Private Key'), T('SSH Key')],
      anchor: 'ssh-keypairs',
    },
    add: {
      hierarchy: [T('Add SSH Keypair')],
      synonyms: [
        T('New SSH Keypair'),
        T('Create SSH Keypair'),
        T('SSH Keypair'),
        T('Add Key'),
        T('New Key'),
        T('Create Key'),
      ],
      anchor: 'add-ssh-keypair',
    },
  },
} satisfies UiSearchableElement;
