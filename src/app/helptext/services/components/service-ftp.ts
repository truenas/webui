import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { helptextGlobal } from 'app/helptext/global-helptext';

export const helptextServiceFtp = {
  port_tooltip: T('Set the port the FTP service listens on.'),
  clients_tooltip: T('The maximum number of simultaneous clients.'),
  ipconnections_tooltip: T('Set the maximum number of connections per IP address.\
 <i>0</i> means unlimited.'),
  loginattempt_tooltip: T('Enter the maximum number of attempts before client is\
 disconnected. Increase this if users are prone to typos.'),
  timeout_notransfer_tooltip: T('Maximum number of seconds a client is allowed to spend connected, after\n'
    + 'authentication, without issuing a command which results in creating an active or passive data connection\n'
    + '(i.e. sending/receiving a file, or receiving a directory listing).'),
  timeout_tooltip: T('Maximum number of seconds that proftpd will allow clients to stay connected without receiving\n'
    + 'any data on either the control or data connection.'),
  onlyanonymous_tooltip: T('Allow anonymous FTP logins with access to the \
 directory specified in <b>Path</b>.'),
  anonpath_tooltip: T('Set the root directory for anonymous FTP connections.'),
  onlylocal_tooltip: T('Allow any local user to log in. By default, only \
 members of the <i>ftp</i> group are allowed to log in.'),
  banner_tooltip: T('Specify the message displayed to local login users after\
 authentication. Not displayed to anonymous login users.'),
  resume_tooltip: T('Set to allow FTP clients to resume interrupted transfers.'),
  defaultroot_tooltip: T('When set, a local user is only allowed access to their home\
 directory if they are a member of the <i>wheel</i> group.'),
  reversedns_tooltip: T('Set to perform reverse DNS lookups on client IPs.\
 This can cause long delays if reverse DNS is not configured.'),
  masqaddress_tooltip: T('Public IP address or hostname. Set if FTP clients\
 cannot connect through a NAT device.'),
  ssltls_certificate_tooltip: T('The SSL certificate to be used for TLS FTP connections.\
 To create a certificate, use <b>System --> Certificates</b>.'),
  filemask_tooltip: T('Sets default permissions for newly created files.'),
  dirmask_tooltip: T('Sets default permissions for newly created directories.'),
  fxp_tooltip: T('Set to enable the File eXchange Protocol. This option\
 makes the server vulnerable to FTP bounce attacks so\
 it is not recommended.'),
  ident_tooltip: T('Setting this option will result in timeouts if\
 <b>identd</b> is not running on the client.'),
  passiveportsmin_tooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.'),
  passiveportsmax_tooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.'),
  localuserbw_placeholder: T('Local User Upload Bandwidth: ') + helptextGlobal.human_readable.suggestion_label,
  userbw_tooltip: T('In KiBs or greater. A default of <i>0 KiB</i> means unlimited. ')
    + helptextGlobal.human_readable.suggestion_tooltip
    + ' KiB.',
  tls_tooltip: T('Allow encrypted connections. Requires a certificate \
 created or imported with the <b>System > Certificates</b> menu.'),
  tls_policy_tooltip: T('Define whether the control channel, \
 data channel, both channels, or neither channel of an FTP \
 session must occur over SSL/TLS. The policies are described \
 <a href="http://www.proftpd.org/docs/directives/configuration_full.html#TLSREQUIRED"\
 target="_blank">here</a>'),

  tls_policy_options: [
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
  tls_opt_allow_client_renegotiations_tooltip: T('Setting this option is <b>not</b> recommended as it\
 breaks several security measures. Refer to\
 <a href="http://www.proftpd.org/docs/contrib/mod_tls.html"\
 target="_blank">mod_tls</a> for more details.'),
  tls_opt_allow_dot_login_tooltip: T('If set, the user home directory is checked\
 for a <b>.tlslogin</b> file which contains one or more PEM-encoded\
 certificates. If not found, the user is prompted for password\
 authentication.'),
  tls_opt_allow_per_user_tooltip: T('If set, the password of the user can be sent unencrypted.'),
  tls_opt_common_name_required_tooltip: T('When set, the common name in the certificate must\
 match the FQDN of the host.'),
  tls_opt_enable_diags_tooltip: T('If set when troubleshooting a connection, logs more\
 verbosely.'),
  tls_opt_export_cert_data_tooltip: T('Set to export the certificate environment variables.'),
  tls_opt_no_empty_fragments_tooltip: T('Enabling this option is <b>not</b> recommended as it\
 bypasses a security mechanism.'),
  tls_opt_no_session_reuse_required_tooltip: T('Setting this option reduces the security of the\
 connection, so only use it if the client does not\
 understand reused SSL sessions.'),
  tls_opt_stdenvvars_tooltip: T('If selected, sets several environment variables.'),
  tls_opt_dns_name_required_tooltip: T('If set, the DNS name of the client must resolve to\
 its IP address and the cert must contain the same DNS name.'),
  tls_opt_ip_address_required_tooltip: T('If set, the client certificate must contain\
 the IP address that matches the IP address of the client.'),
  options_tooltip: T('Used to add additional <a href="https://linux.die.net/man/8/proftpd"\
 target="_blank">proftpd(8)</a> parameters.'),
};
