import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { getManPageLink } from 'app/helpers/man-page.utils';

export default {
  fieldset_basic: T('SSH Keypair'),

  name_placeholder: T('Name'),
  name_tooltip: T('A unique name to identify this keypair. Automatically\
 generated keypairs are named after the object that generated the keypair\
 with " Key" appended to the name.'),

  private_key_placeholder: T('Private Key'),
  private_key_tooltip: T(`See <i>Public key authentication</i> in Authentication in ${getManPageLink('ssh')}.`),

  public_key_placeholder: T('Public Key'),
  public_key_tooltip: T(`See <i>Public key authentication</i> in Authentication in ${getManPageLink('ssh')}.`),

  generate_key_button: T('Generate Keypair'),

  key_instructions: T('Paste either or both public and private keys. If only a public key is entered, \
 it will be stored alone. If only a private key is pasted, the public key will be automatically \
 calculated and entered in the public key field. \
 Click <b>Generate Keypair</b> to create a new keypair. \
 Encrypted keypairs or keypairs with passphrases are not supported.'),
  download_public: T('Download Public Key'),
  download_private: T('Download Private Key'),
  formTitle: T('SSH Keypairs'),
};
