import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';

export const helptextServiceSsh = {
  ssh_bindiface_tooltip: T('Select interfaces for SSH to listen on. Leave all\
 options unselected for SSH to listen on all interfaces.'),

  ssh_tcpport_tooltip: 'Open a port for SSH connection requests.',

  ssh_password_login_groups_tooltip: T('Groups that can log in using password'),

  ssh_passwordauth_tooltip: T('Enabling allows using a password to authenticate \
 the SSH login. <i>Warning:</i> when directory services are enabled, allowing password \
 authentication can grant access to all users imported by the directory service.<br> \
 Disabling changes authentication to require keys for all users. This requires \
 <a href="http://the.earth.li/&percnt;7Esgtatham/putty/0.55/htmldoc/Chapter8.html" target="_blank">additional setup</a> \
 on both the SSH client and server.'),

  ssh_kerberosauth_tooltip: T('Ensure valid entries exist in \
 <b>Directory Services > Kerberos Realms</b> and \
 <b>Directory Services > Kerberos Keytabs</b> and the system \
 can communicate with the Kerberos Domain Controller before \
 enabling this option.'),

  ssh_tcpfwd_tooltip: T('Set to allow users to bypass firewall restrictions\
 using the SSH port <a\
 href="https://www.symantec.com/connect/articles/ssh-port-forwarding"\
 target="_blank">forwarding feature</a>.'),

  ssh_compression_tooltip: T('Set to attempt to reduce latency over slow networks.'),

  ssh_sftp_log_level_tooltip: T('Select the <a\
 href="https://man7.org/linux/man-pages/man3/syslog.3.html"\
 target="_blank">syslog(3)</a> level of the SFTP server.'),
  ssh_sftp_log_level_options: [
    { label: 'Quiet', value: SshSftpLogLevel.Quiet },
    { label: 'Fatal', value: SshSftpLogLevel.Fatal },
    { label: 'Error', value: SshSftpLogLevel.Error },
    { label: 'Info', value: SshSftpLogLevel.Info },
    { label: 'Verbose', value: SshSftpLogLevel.Verbose },
    { label: 'Debug', value: SshSftpLogLevel.Debug },
    { label: 'Debug2', value: SshSftpLogLevel.Debug2 },
    { label: 'Debug3', value: SshSftpLogLevel.Debug3 },
  ],

  ssh_sftp_log_facility_tooltip: T('Select the <a\
 href="https://man7.org/linux/man-pages/man3/syslog.3.html"\
 target="_blank">syslog(3)</a> facility of the SFTP\
 server.'),
  ssh_sftp_log_facility_options: [
    { label: 'Daemon', value: SshSftpLogFacility.Daemon },
    { label: 'User', value: SshSftpLogFacility.User },
    { label: 'Auth', value: SshSftpLogFacility.Auth },
    { label: 'Local 0', value: SshSftpLogFacility.Local0 },
    { label: 'Local 1', value: SshSftpLogFacility.Local1 },
    { label: 'Local 2', value: SshSftpLogFacility.Local2 },
    { label: 'Local 3', value: SshSftpLogFacility.Local3 },
    { label: 'Local 4', value: SshSftpLogFacility.Local4 },
    { label: 'Local 5', value: SshSftpLogFacility.Local5 },
    { label: 'Local 6', value: SshSftpLogFacility.Local6 },
    { label: 'Local 7', value: SshSftpLogFacility.Local7 },
  ],

  ssh_options_tooltip: T('Add any more <a\
 href="https://man7.org/linux/man-pages/man5/sshd_config.5.html"\
 target="_blank">sshd_config(5)</a> options not covered\
 in this screen. Enter one option per line. These\
 options are case-sensitive. Misspellings can prevent\
 the SSH service from starting.'),

  ssh_weak_ciphers_tooltip: T('Allow more ciphers for \
 <a href="https://man7.org/linux/man-pages/man8/sshd.8.html" target="_blank">sshd(8)</a> \
 in addition to the defaults in \
 <a href="https://man7.org/linux/man-pages/man5/sshd_config.5.html" target="_blank">sshd_config(5)</a>. \
 <code>None</code> allows unencrypted SSH connections and \
 <code>AES128-CBC</code> allows the 128-bit \
 <a href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf" target="_blank">Advanced Encryption Standard</a>.<br><br> \
 WARNING: these ciphers are considered security vulnerabilities and \
 should only be allowed in a secure network environment.'),
  ssh_weak_ciphers_options: [
    { label: T('None'), value: SshWeakCipher.None },
    { label: 'AES128-CBC', value: SshWeakCipher.Aes128Cbc },
  ],
};
