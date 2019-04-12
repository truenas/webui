import { T } from '../../../translate-marker';

export default {
ssh_bindiface_placeholder : T('Bind interfaces'),
ssh_bindiface_tooltip: T('Select interfaces for SSH to listen on. Leave all\
 options unselected for SSH to listen on all interfaces.'),

ssh_tcpport_placeholder : T('TCP port'),
ssh_tcpport_tooltip: 'Open a port for SSH connection requests.',

ssh_rootlogin_placeholder : T('Log in as root with password'),
ssh_rootlogin_tooltip: T('<b>Root logins are discouraged.</b> Set to allow root\
 logins. A password must be set for the <i>root</i>\
 user in <a href="%%docurl%%/accounts.html%%webversion%%#users"\
 target="_blank">Users</a>.'),

ssh_passwordauth_placeholder : T('Allow password authentication'),
ssh_passwordauth_tooltip: T('Unset to require key-based authentication for\
 all users. This requires <a\
 href="http://the.earth.li/%7Esgtatham/putty/0.55/htmldoc/Chapter8.html"\
 target="_blank">additional setup</a> on both the SSH\
 client and server.'),

ssh_kerberosauth_placeholder : T('Allow Kerberos authentication'),
ssh_kerberosauth_tooltip: T('Ensure <a\
 href="%%docurl%%/directoryservices.html%%webversion%%#kerberos-realms"\
 target="_blank">Kerberos Realms</a> and <a\
 href="%%docurl%%/directoryservices.html%%webversion%%#kerberos-keytabs"\
 target="_blank">Kerberos Keytabs</a> are configured\
 and the system can communicate with the Kerberos\
 Domain Controller before setting.'),

ssh_tcpfwd_placeholder : T('Allow TCP port forwarding'),
ssh_tcpfwd_tooltip: T('Set to allow users to bypass firewall restrictions\
 using the SSH port <a\
 href="https://www.symantec.com/connect/articles/ssh-port-forwarding"\
 target="_blank">forwarding feature</a>.'),

ssh_compression_placeholder : T('Compress connections'),
ssh_compression_tooltip: T('Set to attempt to reduce latency over slow networks.'),

ssh_sftp_log_level_placeholder : T('SFTP log level'),
ssh_sftp_log_level_tooltip: T('Select the <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=syslog"\
 target="_blank">syslog(3)</a> level of the SFTP server.'),
ssh_sftp_log_level_options : [
  {label : '', value : ''},
  {label : 'Quiet', value : 'QUIET'},
  {label : 'Fatal', value : 'FATAL'},
  {label : 'Error', value : 'ERROR'},
  {label : 'Info', value : 'INFO'},
  {label : 'Verbose', value : 'VERBOSE'},
  {label : 'Debug', value : 'DEBUG'},
  {label : 'Debug2', value : 'DEBUG2'},
  {label : 'Debug3', value : 'DEBUG3'},
],

ssh_sftp_log_facility_placeholder : T('SFTP log facility'),
ssh_sftp_log_facility_tooltip: T('Select the <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=syslog"\
 target="_blank">syslog(3)</a> facility of the SFTP\
 server.'),
ssh_sftp_log_facility_options : [
  {label : '', value : ''},
  {label : 'Daemon', value : 'DAEMON'},
  {label : 'User', value : 'USER'},
  {label : 'Auth', value : 'AUTH'},
  {label : 'Local 0', value : 'LOCAL0'},
  {label : 'Local 1', value : 'LOCAL1'},
  {label : 'Local 2', value : 'LOCAL2'},
  {label : 'Local 3', value : 'LOCAL3'},
  {label : 'Local 4', value : 'LOCAL4'},
  {label : 'Local 5', value : 'LOCAL5'},
  {label : 'Local 6', value : 'LOCAL6'},
  {label : 'Local 7', value : 'LOCAL7'},
],

ssh_options_placeholder : T('Extra options'),
ssh_options_tooltip: T('Add any more <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=sshd_config"\
 target="_blank">sshd_config(5)</a> options not covered\
 in this screen. Enter one option per line. These\
 options are case-sensitive. Misspellings can prevent\
 the SSH service from starting.')
}