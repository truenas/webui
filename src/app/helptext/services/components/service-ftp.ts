import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import globalHelptext from 'app/helptext/global-helptext';
import { portRangeValidator, rangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';

export default {
  fieldset_general: T('General Options'),
  fieldset_access: T('Access'),
  fieldset_bw: T('Bandwidth'),
  fieldset_tls: 'TLS',
  fieldset_other: T('Other Options'),

  port_placeholder: T('Port'),
  port_tooltip: T('Set the port the FTP service listens on.'),
  port_validation: [portRangeValidator(), Validators.required],

  clients_placeholder: T('Clients'),
  clients_tooltip: T('The maximum number of simultaneous clients.'),
  clients_validation: [rangeValidator(1, 10000), Validators.required],

  ipconnections_placeholder: T('Connections'),
  ipconnections_tooltip: T('Set the maximum number of connections per IP address.\
 <i>0</i> means unlimited.'),
  ipconnections_validation: [rangeValidator(0, 1000), Validators.required],

  loginattempt_placeholder: T('Login Attempts'),
  loginattempt_tooltip: T('Enter the maximum number of attempts before client is\
 disconnected. Increase this if users are prone to typos.'),
  loginattempt_validation: [rangeValidator(0, 1000), Validators.required],

  timeout_notransfer_placeholder: T('Notransfer Timeout'),
  timeout_notransfer_tooltip: T('Maximum number of seconds a client is allowed to spend connected, after\n'
    + 'authentication, without issuing a command which results in creating an active or passive data connection\n'
    + '(i.e. sending/receiving a file, or receiving a directory listing).'),
  timeout_notransfer_validation: [rangeValidator(0, 10000), Validators.required],

  timeout_placeholder: T('Timeout'),
  timeout_tooltip: T('Maximum number of seconds that proftpd will allow clients to stay connected without receiving\n'
    + 'any data on either the control or data connection.'),
  timeout_validation: [rangeValidator(0, 10000), Validators.required],

  rootlogin_placeholder: T('Allow Root Login'),
  rootlogin_tooltip: T('Setting this option is discouraged as it increases security risk.'),

  onlyanonymous_placeholder: T('Allow Anonymous Login'),
  onlyanonymous_tooltip: T('Allow anonymous FTP logins with access to the \
 directory specified in <b>Path</b>.'),

  anonpath_placeholder: T('Path'),
  anonpath_tooltip: T('Set the root directory for anonymous FTP connections.'),

  onlylocal_placeholder: T('Allow Local User Login'),
  onlylocal_tooltip: T('Allow any local user to log in. By default, only \
 members of the <i>ftp</i> group are allowed to log in.'),

  banner_placeholder: T('Display Login'),
  banner_tooltip: T('Specify the message displayed to local login users after\
 authentication. Not displayed to anonymous login users.'),

  resume_placeholder: T('Allow Transfer Resumption'),
  resume_tooltip: T('Set to allow FTP clients to resume interrupted transfers.'),

  defaultroot_placeholder: T('Always Chroot'),
  defaultroot_tooltip: T('When set, a local user is only allowed access to their home\
 directory if they are a member of the <i>wheel</i> group.'),

  reversedns_placeholder: T('Perform Reverse DNS Lookups'),
  reversedns_tooltip: T('Set to perform reverse DNS lookups on client IPs.\
 This can cause long delays if reverse DNS is not configured.'),

  masqaddress_placeholder: T('Masquerade Address'),
  masqaddress_tooltip: T('Public IP address or hostname. Set if FTP clients\
 cannot connect through a NAT device.'),

  ssltls_certificate_placeholder: T('Certificate'),
  ssltls_certificate_tooltip: T('The SSL certificate to be used for TLS FTP connections.\
 To create a certificate, use <b>System --> Certificates</b>.'),

  filemask_placeholder: T('File Permissions'),
  filemask_tooltip: T('Sets default permissions for newly created files.'),

  dirmask_placeholder: T('Directory Permissions'),
  dirmask_tooltip: T('Sets default permissions for newly created directories.'),

  fxp_placeholder: T('Enable FXP'),
  fxp_tooltip: T('Set to enable the File eXchange Protocol. This option\
 makes the server vulnerable to FTP bounce attacks so\
 it is not recommended.'),

  ident_placeholder: T('Require IDENT Authentication'),
  ident_tooltip: T('Setting this option will result in timeouts if\
 <b>identd</b> is not running on the client.'),

  passiveportsmin_placeholder: T('Minimum Passive Port'),
  passiveportsmin_tooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.'),
  passiveportsmin_validation: [rangeValidator(0, 65535), Validators.required],

  passiveportsmax_placeholder: T('Maximum Passive Port'),
  passiveportsmax_tooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.'),
  passiveportsmax_validation: [rangeValidator(0, 65535), Validators.required],

  localuserbw_placeholder: T('Local User Upload Bandwidth: '),
  userbw_tooltip: T('In KiBs or greater. A default of <i>0 KiB</i> means unlimited. '),
  userbw_validation: [Validators.required],

  bandwidth_err: globalHelptext.human_readable.input_error,

  localuserdlbw_placeholder: T('Local User Download Bandwidth'),

  anonuserbw_placeholder: T('Anonymous User Upload Bandwidth'),

  anonuserdlbw_placeholder: T('Anonymous User Download Bandwidth'),

  tls_placeholder: T('Enable TLS'),
  tls_tooltip: T('Allow encrypted connections. Requires a certificate \
 created or imported with the <b>System > Certificates</b> menu.'),

  tls_policy_placeholder: T('TLS Policy'),
  tls_policy_tooltip: T('Define whether the control channel, \
 data channel, both channels, or neither channel of an FTP \
 session must occur over SSL/TLS. The policies are described \
 <a href="http://www.proftpd.org/docs/directives/linked/config_ref_TLSRequired.html"\
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

  tls_opt_allow_client_renegotiations_placeholder: T('TLS Allow Client Renegotiations'),
  tls_opt_allow_client_renegotiations_tooltip: T('Setting this option is <b>not</b> recommended as it\
 breaks several security measures. Refer to\
 <a href="http://www.proftpd.org/docs/contrib/mod_tls.html"\
 target="_blank">mod_tls</a> for more details.'),

  tls_opt_allow_dot_login_placeholder: T('TLS Allow Dot Login'),
  tls_opt_allow_dot_login_tooltip: T('If set, the user home directory is checked\
 for a <b>.tlslogin</b> file which contains one or more PEM-encoded\
 certificates. If not found, the user is prompted for password\
 authentication.'),

  tls_opt_allow_per_user_placeholder: T('TLS Allow Per User'),
  tls_opt_allow_per_user_tooltip: T('If set, the password of the user can be sent unencrypted.'),

  tls_opt_common_name_required_placeholder: T('TLS Common Name Required'),
  tls_opt_common_name_required_tooltip: T('When set, the common name in the certificate must\
 match the FQDN of the host.'),

  tls_opt_enable_diags_placeholder: T('TLS Enable Diagnostics'),
  tls_opt_enable_diags_tooltip: T('If set when troubleshooting a connection, logs more\
 verbosely.'),

  tls_opt_export_cert_data_placeholder: T('TLS Export Certificate Data'),
  tls_opt_export_cert_data_tooltip: T('Set to export the certificate environment variables.'),

  tls_opt_no_cert_request_placeholder: T('TLS No Certificate Request'),
  tls_opt_no_cert_request_tooltip: T('Set if the client cannot connect, and\
 it is suspected the client is poorly handling the server certificate request.'),

  tls_opt_no_empty_fragments_placeholder: T('TLS No Empty Fragments'),
  tls_opt_no_empty_fragments_tooltip: T('Enabling this option is <b>not</b> recommended as it\
 bypasses a security mechanism.'),

  tls_opt_no_session_reuse_required_placeholder: T('TLS No Session Reuse Required'),
  tls_opt_no_session_reuse_required_tooltip: T('Setting this option reduces the security of the\
 connection, so only use it if the client does not\
 understand reused SSL sessions.'),

  tls_opt_stdenvvars_placeholder: T('TLS Export Standard Vars'),
  tls_opt_stdenvvars_tooltip: T('If selected, sets several environment variables.'),

  tls_opt_dns_name_required_placeholder: T('TLS DNS Name Required'),
  tls_opt_dns_name_required_tooltip: T('If set, the DNS name of the client must resolve to\
 its IP address and the cert must contain the same DNS name.'),

  tls_opt_ip_address_required_placeholder: T('TLS IP Address Required'),
  tls_opt_ip_address_required_tooltip: T('If set, the client certificate must contain\
 the IP address that matches the IP address of the client.'),

  options_placeholder: T('Auxiliary Parameters'),
  options_tooltip: T('Used to add additional <a href="https://linux.die.net/man/8/proftpd"\
 target="_blank">proftpd(8)</a> parameters.'),

  rootlogin_dialog_title: T('Allow Root Login'),
  rootlogin_dialog_message: T('Enabling this option can expose administrator credentials and is not recommended.'),

  formTitle: 'FTP',
};
