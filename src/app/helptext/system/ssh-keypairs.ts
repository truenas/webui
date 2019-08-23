import { T } from '../../translate-marker';

export default {
    name_placeholder: T('Name'),
    name_tooltip: T('A unique name to identify this keypair. Automatically\
 generated keypairs are named after the object that generated the keypair\
 with " Key" appended to the name.'),

    private_key_placeholder: T('Private Key'),
    private_key_tooltip: T('See <i>Public key authentication</i> in <a href="https://www.freebsd.org/cgi/man.cgi?query=ssh"\
 target="_blank">SSH/Authentication</a>.'),

    public_key_placeholder: T('Public Key'),
    public_key_tooltip: T('See <i>Public key authentication</i> in <a href="https://www.freebsd.org/cgi/man.cgi?query=ssh"\
 target="_blank">SSH/Authentication</a>.'),

    generate_key_button: T('Generate Keypair'),

    key_instructions: T('Paste either or both public and private keys. If only a public key is entered, \
 it will be stored alone. If only a private key is pasted, the public key will be automatically \
 calculated and entered in the public key field. \
 Click <b>Generate Keypair</b> to create a new keypair. \
 Encrypted keypairs or keypairs with passphrases are not supported.')
}
