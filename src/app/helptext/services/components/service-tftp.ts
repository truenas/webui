import { T } from '../../../translate-marker';

export default {
tftp_fieldset_path: T('Path'),
tftp_fieldset_conn: T('Connection'),
tftp_fieldset_access: T('Access'),
tftp_fieldset_other: T('Other Options'),

tftp_directory_placeholder : T('Directory'),
tftp_directory_tooltip : T('Browse to an <b>existing</b> directory to use for\
 storage. Some devices can require a specific\
 directory name. Consult the documentation for that\
 device to see if there are any restrictions.'),

tftp_newfiles_placeholder : T('Allow New Files'),
tftp_newfiles_tooltip : T('Set when network devices need to send files to\
 the system.'),

tftp_host_placeholder: T('Host'),
tftp_host_tooltip: T('The default host to use for TFTP transfers. Enter an IP address. Example: 192.0.2.1'),

tftp_port_placeholder : T('Port'),
tftp_port_tooltip : T('The UDP port number that listens for TFTP requests. Example: 8050'),

tftp_username_placeholder : T('Username'),
tftp_username_tooltip : T('Select the account to use for TFTP requests. This\
 account must have permission to the <b>Directory</b>.'),

tftp_umask_placeholder : T('File Permissions'),
tftp_umask_tooltip : T('Adjust the file permissions using the checkboxes.'),

tftp_options_placeholder : T('Extra options'),
tftp_options_tooltip : T('Add more options from <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=tftpd"\
 target="_blank">tftpd(8)</a>. Add one option on each\
 line.')
}
