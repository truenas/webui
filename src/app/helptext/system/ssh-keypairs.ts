import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSshKeypairs = {
  nameTooltip: T('A unique name to identify this keypair. Automatically\
 generated keypairs are named after the object that generated the keypair\
 with " Key" appended to the name.'),

  privateKeyLabel: T('Private Key'),
  privateKeyTooltip: T('See <i>Public key authentication</i> in <a href="https://man7.org/linux/man-pages/man1/ssh.1.html"\
 target="_blank">SSH/Authentication</a>.'),

  publicKeyLabel: T('Public Key'),
  publicKeyTooltip: T('See <i>Public key authentication</i> in <a href="https://man7.org/linux/man-pages/man1/ssh.1.html"\
 target="_blank">SSH/Authentication</a>.'),

  keyInstructions: T('Paste either or both public and private keys. If only a public key is entered, \
 it will be stored alone. If only a private key is pasted, the public key will be automatically \
 calculated and entered in the public key field. \
 Click <b>Generate Keypair</b> to create a new keypair. \
 Encrypted keypairs or keypairs with passphrases are not supported.'),
};
