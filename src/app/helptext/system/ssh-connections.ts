import { T } from '../../translate-marker';

export default {
    name_placeholder: T('Name'),
    name_tooltip: T('Descriptive name of this SSH connection. SSH \
 connection names must be unique.'),

    setup_method_placeholder: T('Setup Method'),
    setup_method_tooltip: T('How to configure the connection\:<br><br> \
 <i>Manual</i> requires configuring authentication on the remote system. \
 This can require copying SSH keys and modifying the <i>root</i> user \
 account on that system.<br><br> \
 <i>Semi-automatic</i> is only functional when configuring an SSH \
 connection between FreeNAS systems. After authenticating the \
 connection, all remaining connection options are automatically \
 configured.'),

    host_placeholder: T('Host'),
    host_tooltip: T('Enter the hostname or IP address of the remote \
 system.'),

    port_placeholder: T('Port'),
    port_tooltip: T('Port number on the remote system to use for the SSH \
 connection.'),

    username_placeholder: T('Username'),
    username_tooltip: T('User account name to use for logging in to the \
 remote system.'),

    private_key_placeholder: T('Private Key'),
    private_key_tooltip: T('Choose a saved SSH Keypair or select \
 <i>Generate New</i> to create a new keypair and apply it to this \
 connection.'),

    remote_host_key_placeholder: T('Remote Host Key'),
    remote_host_key_tooltip: T('Remote system SSH key for this system to \
 authenticate the connection. When all other fields are properly \
 configured, click <b>DISCOVER REMOTE HOST KEY</b> to query the remote \
 system and automatically populate this field.'),

    cipher_placeholder: T('Cipher'),
    cipher_tooltip: T('Connection security level:<br> \
 <ul><li><i>Standard</i> is most secure, but has the greatest impact on \
 connection speed.</li><br> \
 <li><i>Fast</i> is less secure than <i>Standard</i> but can give \
 reasonable transfer rates for devices with limited cryptographic speed.</li><br> \
 <li><i>Disabled</i> removes all security in favor of maximizing \
 connection speed. Disabling the security should only be used within a \
 secure, trusted network.</li></ul>'),

    connect_timeout_placeholder: T('Connect Timeout'),
    connect_timeout_tooltip: T('Time \(in seconds\) before the system \
 stops attempting to establish a connection with the remote system.'),

    url_placeholder: T('FreeNAS URL'),
    url_tooltip: T('Hostname or IP address of the remote FreeNAS \
 system. A valid URL scheme is required. Example: \
 <b>https://<i>10.231.3.76</i></b>'),

    password_placeholder: T('Password'),
    password_tooltip: T('User account password used to log in to the \
 FreeNAS system.'),

    discover_remote_host_key_button: T('Discover Remote Host Key')
}
