import { T } from '../../../translate-marker';

export default {
    // Helptext for client component
    client: {
        header: T('OpenVPN Client Settings'),
        nobind: {
            placeholder: T('Nobind'),
            tooltip: T('Must be enabled if OpenVPN client and server are to run concurrently.')
        }, 
        remote: {
            placeholder: T('Remote'),
            tooltip: T('A valid ip address or domain name to which OpenVPN will connect.')
        },
        tls_crypt_auth: {
            placeholder: T('TLS Crypt Auth'),
            tooltip: T('Provide static key for authentication/encryption of all control \
 channel packets when <code>tls_crypt_auth_enabled</code> is enabled.')
        }        
    },
    // Helptext for server component
    server: {
        header: T('OpenVPN Server Settings'),
        netmask: {
            placeholder: T('Netmask'),
            tooltip: T('A tooltip about this topic')
        },
        server: {
            placeholder: T('Server'),
            tooltip: T('A tooltip about this topic')
        },
        tls_crypt_auth: {
            placeholder: T('TLS Crypt Auth'),
            tooltip: T('When <code>tls_crypt_auth_enabled</code> is enabled and <code>tls_crypt_auth</code> is not provided, \
 a static key is automatically generated to be used with OpenVPN client.')
        },
        topology: {
            placeholder: T('Topology'),
            tooltip: T('Select a network topology.'),
            enum: [{
                label: '---',
                value: null,
                },{
                label: 'NET30',
                value: 'NET30',
                }, {
                label: 'P2P',
                value: 'P2P'
                }, {
                label: 'SUBNET',
                value: 'SUBNET'
                }
            ]
        },
        buttons : {
            renew: T('Renew Static Key'),
            download: T('Download Client Config')
        },
        static_dialog: {
            title: T('New Static Key Settings'),
            buttonTxt: T('Close')
        }
    }, 
    // Helptext for both components
    certificate: {
        placeholder: T('Client Certificate'),
        tooltip: T('Choose a valid client certificate which exists \
on this system and hasn\'t been revoked. Find more about generating certificates and CAs \
for OpenVPN <a href="https://community.openvpn.net/openvpn/wiki/HOWTO#SettingupyourownCertificateAuthorityCAandgeneratingcertificatesandkeysforanOpenVPNserverandmultipleclients" \
target="_blank">here.</a>')
    },
    root_ca: {
        placeholder: T('Root CA'),
        tooltip: T('Choose the root Certificate Authority that was used to sign the Client and Server certificates. \
        Find more about generating certificates and CAs for OpenVPN \
 <a href="https://community.openvpn.net/openvpn/wiki/HOWTO#SettingupyourownCertificateAuthorityCAandgeneratingcertificatesandkeysforanOpenVPNserverandmultipleclients" target="_blank">here.</a>')
    },
    tls_crypt_auth_enabled: {
        placeholder: T('TLS Crypt Auth Enabled'),
        tooltip: T('Enable/disable TLS Web Client Authentication.')
    },
    port: {
        placeholder: T('Port'),
        tooltip: T('Enter a port number to use for connection')
    },
    additional_parameters: {
        placeholder: T('Additional Parameters'),
        tooltip: T('A tooltip about this topic')
    },
    authentication_algorithm: {
        placeholder: T('Authentication Algorithm'),
        tooltip: T('Choose an authentication algorithm.')
    },
    cipher: {
        placeholder: T('Cipher'),
        tooltip: T('Choose a cipher')
    },
    compression: {
        placeholder: T('Compression'),
        tooltip: T('Choose a compression algorithm.'),
        enum: [{
            label: 'LZO',
            value: 'LZO',
            }, {
            label: 'LZ4',
            value: 'LZ4',
        }]
    },
    device_type: {
        placeholder: T('Device Type'),
        tooltip: T('Choose a virtual network interface. More information can be found \
 <a href="https://community.openvpn.net/openvpn/wiki/BridgingAndRouting" target="_blank">here</a>.'),
        enum: [{
            label: 'TUN',
            value: 'TUN',
            }, {
            label: 'TAP',
            value: 'TAP'
        }]
    },
    protocol: {
        placeholder: T('Protocol'),
        tooltip: T('Choose a protocol.'),
        enum: [{
            label: 'UDP',
            value: 'UDP',
            }, {
            label: 'TCP',
            value: 'TCP'
        }]
    },
    error_dialog_title: T('Error')
}