import { T } from '../../../translate-marker';

export default {
    client: {
        header: T('OpenVPN Client'),
        nobind: {
            placeholder: T('Nobind'),
            tooltip: T('Must be enabled if OpenVPN client / server are to run concurrently.')
        },
        tls_crypt_auth_enabled: {
            placeholder: T('TLS Crypt Auth Enabled'),
            tooltip: T('A tooltip about this topic')
        },
        client_certificate: {
            placeholder: T('Client Certificate'),
            tooltip: T('A tooltip about this topic')
        },
        root_ca: {
            placeholder: T('Root CA'),
            tooltip: T('A tooltip about this topic')
        },
        port: {
            placeholder: T('Port'),
            tooltip: T('A tooltip about this topic')
        },
        additional_parameters: {
            placeholder: T('Additional Parameters'),
            tooltip: T('A tooltip about this topic')
        },
        authentication_algorithm: {
            placeholder: T('Authentication Algorithm'),
            tooltip: T('A tooltip about this topic')
        },
        cipher: {
            placeholder: T('Cipher'),
            tooltip: T('A tooltip about this topic')
        },
        compression: {
            placeholder: T('Compression'),
            tooltip: T('A tooltip about this topic'),
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
            tooltip: T('A tooltip about this topic'),
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
            tooltip: T('A tooltip about this topic'),
            enum: [{
                label: 'UDP',
                value: 'UDP',
                }, {
                label: 'TCP',
                value: 'TCP'
            }]
        },
        remote: {
            placeholder: T('Remote'),
            tooltip: T('A valid ip address / domain which OpenVPN will try to connect to.')
        },
        tls_crypt_auth: {
            placeholder: T('TLS Crypt Auth'),
            tooltip: T('A tooltip about this topic')
        },
        
    },
    server: {
        header: T('OpenVPN Server')
    }
}