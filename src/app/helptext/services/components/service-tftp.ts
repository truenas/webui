import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  tftp_directory_tooltip: T('Browse to an <b>existing</b> directory to use for\
 storage. Some devices can require a specific\
 directory name. Consult the documentation for that\
 device to see if there are any restrictions.'),
  tftp_newfiles_tooltip: T('Set when network devices need to send files to\
 the system.'),
  tftp_host_tooltip: T('The default host to use for TFTP transfers. Enter an IP address. Example: 192.0.2.1'),
  tftp_port_tooltip: T('The UDP port number that listens for TFTP requests. Example: 8050'),
  tftp_username_tooltip: T('Select the account to use for TFTP requests. This\
 account must have permission to the <b>Directory</b>.'),
  tftp_umask_tooltip: T('Adjust the file permissions using the checkboxes.'),
  tftp_options_tooltip: T('Add more options from <a\
 href="https://linux.die.net/man/8/tftpd"\
 target="_blank">tftpd(8)</a>. Add one option on each\
 line.'),
};
