import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { OpenVpnDeviceType } from 'app/enums/open-vpn-device-type.enum';

export default {
  // Helptext for client component
  client: {
    header: T('OpenVPN Client Settings'),
    nobind: {
      placeholder: T('Nobind'),
      tooltip: T('Enable to prevent binding to local address and port. \
 Must be enabled if OpenVPN client and server are to run concurrently.'),
    },
    remote: {
      placeholder: T('Remote'),
      tooltip: T('A valid IP address or domain name to which OpenVPN will connect.'),
    },
    tls_crypt_auth: {
      placeholder: T('TLS Crypt Auth'),
      tooltip: T('Provide static key for authentication/encryption of all control \
 channel packets when <code>tls_crypt_auth_enabled</code> is enabled.'),
    },
    formTitle: T('Open VPN Client'),

  },
  // Helptext for server component
  server: {
    header: T('OpenVPN Server Settings'),
    server: {
      tooltip: T('Enter the IP address and netmask of the server.'),
    },
    tls_crypt_auth: {
      tooltip: T('When <code>tls_crypt_auth_enabled</code> is enabled and <code>tls_crypt_auth</code> is not provided, \
 a static key is automatically generated to be used with OpenVPN client.'),
    },
    topology: {
      tooltip: T('Configure virtual addressing topology when running in TUN mode. \
 (TAP mode always uses a SUBNET topology.)'),
      enum: [{
        label: 'NET30',
        value: 'NET30',
      }, {
        label: 'P2P',
        value: 'P2P',
      }, {
        label: 'SUBNET',
        value: 'SUBNET',
      },
      ],
    },
  },
  // Helptext for both components
  certificate: {
    client_placeholder: T('Client Certificate'),
    tooltip: T('Choose a valid client certificate which exists \
on this system and hasn\'t been revoked. Find more about generating certificates and CAs \
for OpenVPN <a href="https://community.openvpn.net/openvpn/wiki/HOWTO#SettingupyourownCertificateAuthorityCAandgeneratingcertificatesandkeysforanOpenVPNserverandmultipleclients" \
target="_blank">here.</a>'),
  },
  root_ca: {
    placeholder: T('Root CA'),
    tooltip: T('Choose the root Certificate Authority that was used to sign the Client and Server certificates. \
        Find more about generating certificates and CAs for OpenVPN \
 <a href="https://community.openvpn.net/openvpn/wiki/HOWTO#SettingupyourownCertificateAuthorityCAandgeneratingcertificatesandkeysforanOpenVPNserverandmultipleclients" target="_blank">here.</a>'),
  },
  tls_crypt_auth_enabled: {
    placeholder: T('TLS Crypt Auth Enabled'),
    tooltip: T('Enable/disable TLS Web Client Authentication.'),
  },
  port: {
    placeholder: T('Port'),
    tooltip: T('Enter a port number to use for the connection.'),
  },
  additional_parameters: {
    placeholder: T('Additional Parameters'),
    tooltip: T('Additional parameters.'),
  },
  authentication_algorithm: {
    placeholder: T('Authentication Algorithm'),
    tooltip: T('Choose an algorithm to authenticate packets.'),
  },
  cipher: {
    placeholder: T('Cipher'),
    tooltip: T('Choose a cipher algorithm to encrypt data channel packets.'),
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
    }],
  },
  device_type: {
    placeholder: T('Device Type'),
    tooltip: T('Choose a virtual network interface. More information can be found \
 <a href="https://community.openvpn.net/openvpn/wiki/BridgingAndRouting" target="_blank">here</a>.'),
    enum: [{
      label: 'TUN',
      value: OpenVpnDeviceType.Tun,
    }, {
      label: 'TAP',
      value: OpenVpnDeviceType.Tap,
    }],
  },
  protocol: {
    placeholder: T('Protocol'),
    tooltip: T('Choose the protocol to use when connecting with the remote system.'),
    enum: [{
      label: 'UDP',
      value: 'UDP',
    }, {
      label: 'UDP4',
      value: 'UDP4',
    }, {
      label: 'UDP6',
      value: 'UDP6',
    }, {
      label: 'TCP',
      value: 'TCP',
    }, {
      label: 'TCP4',
      value: 'TCP4',
    }, {
      label: 'TCP6',
      value: 'TCP6',
    }],
  },
};
