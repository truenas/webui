import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { helptextGlobal } from 'app/helptext/global-helptext';

export const helptextServiceFtp = {
  portTooltip: T('Set the port the FTP service listens on.'),
  clientsTooltip: T('The maximum number of simultaneous clients.'),
  ipconnectionsTooltip: T('Set the maximum number of connections per IP address.\
 <i>0</i> means unlimited.'),
  loginattemptTooltip: T('Enter the maximum number of attempts before client is\
 disconnected. Increase this if users are prone to typos.'),
  timeoutNotransferTooltip: T('Maximum number of seconds a client is allowed to spend connected, after\n'
    + 'authentication, without issuing a command which results in creating an active or passive data connection\n'
    + '(i.e. sending/receiving a file, or receiving a directory listing).'),
  timeoutTooltip: T('Maximum number of seconds that proftpd will allow clients to stay connected without receiving\n'
    + 'any data on either the control or data connection.'),
  onlyanonymousTooltip: T('Allow anonymous FTP logins with access to the \
 directory specified in <b>Path</b>.'),
  anonpathTooltip: T('Set the root directory for anonymous FTP connections.'),
  onlylocalTooltip: T('Allow any local user to log in. By default, only \
 members of the <i>ftp</i> group are allowed to log in.'),
  bannerTooltip: T('Specify the message displayed to local login users after\
 authentication. Not displayed to anonymous login users.'),
  resumeTooltip: T('Set to allow FTP clients to resume interrupted transfers.'),
  defaultrootTooltip: T('When set, all local users are only allowed to access their home directory.'),
  reversednsTooltip: T('Set to perform reverse DNS lookups on client IPs.\
 This can cause long delays if reverse DNS is not configured.'),
  masqaddressTooltip: T('Public IP address or hostname. Set if FTP clients\
 cannot connect through a NAT device.'),
  ssltlsCertificateTooltip: T('The SSL certificate to be used for TLS FTP connections.\
 To create a certificate, use <b>System --> Certificates</b>.'),
  filemaskTooltip: T('Sets default permissions for newly created files.'),
  dirmaskTooltip: T('Sets default permissions for newly created directories.'),
  fxp_tooltip: T('Set to enable the File eXchange Protocol. This option\
 makes the server vulnerable to FTP bounce attacks so\
 it is not recommended.'),
  identTooltip: T('Setting this option will result in timeouts if\
 <b>identd</b> is not running on the client.'),
  passiveportsminTooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.'),
  passiveportsmaxTooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.'),
  localuserbwLabel: T('Local User Upload Bandwidth: ') + helptextGlobal.humanReadable.suggestionLabel,
  userbwTooltip: T('In KiBs or greater. A default of <i>0 KiB</i> means unlimited. ')
    + helptextGlobal.humanReadable.suggestionTooltip
    + ' KiB.',
  tlsTooltip: T('Allow encrypted connections. Requires a certificate \
 created or imported with the <b>System > Certificates</b> menu.'),
  tlsPolicyTooltip: T('Define whether the control channel, \
 data channel, both channels, or neither channel of an FTP \
 session must occur over SSL/TLS. The policies are described \
 <a href="http://www.proftpd.org/docs/directives/configuration_full.html#TLSREQUIRED"\
 target="_blank">here</a>'),

  tlsPolicyOptions: [
    { label: 'On', value: 'on' },
    { label: 'Off', value: 'off' },
    { label: 'Data', value: 'data' },
    { label: '!Data', value: '!data' },
    { label: 'Auth', value: 'auth' },
    { label: 'Ctrl', value: 'ctrl' },
    { label: 'Ctrl + Data', value: 'ctrl+data' },
    { label: 'Ctrl + !Data', value: 'ctrl+!data' },
    { label: 'Auth + Data', value: 'auth+data' },
    { label: 'Auth + !Data', value: 'auth+!data' },
  ],
  tlsAllowClientRenegotiationsTooltip: T('Setting this option is <b>not</b> recommended as it\
 breaks several security measures. Refer to\
 <a href="http://www.proftpd.org/docs/contrib/mod_tls.html"\
 target="_blank">mod_tls</a> for more details.'),
  tlsAllowDotLoginTooltip: T('If set, the user home directory is checked\
 for a <b>.tlslogin</b> file which contains one or more PEM-encoded\
 certificates. If not found, the user is prompted for password\
 authentication.'),
  tlsAllowPerUserTooltip: T('If set, the password of the user can be sent unencrypted.'),
  tlsCommonNameRequiredTooltip: T('When set, the common name in the certificate must\
 match the FQDN of the host.'),
  tlsEnableDiagsTooltip: T('If set when troubleshooting a connection, logs more\
 verbosely.'),
  tlsExportCertDataTooltip: T('Set to export the certificate environment variables.'),
  tlsNoEmptyFragmentsTooltip: T('Enabling this option is <b>not</b> recommended as it\
 bypasses a security mechanism.'),
  tlsNoSessionReuseRequiredTooltip: T('Setting this option reduces the security of the\
 connection, so only use it if the client does not\
 understand reused SSL sessions.'),
  tlsStdenvvarsTooltip: T('If selected, sets several environment variables.'),
  tlsDnsNameRequiredTooltip: T('If set, the DNS name of the client must resolve to\
 its IP address and the cert must contain the same DNS name.'),
  tlsIpAddressRequiredTooltip: T('If set, the client certificate must contain\
 the IP address that matches the IP address of the client.'),
  optionsTooltip: T('Used to add additional <a href="https://linux.die.net/man/8/proftpd"\
 target="_blank">proftpd(8)</a> parameters.'),
};
