import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { RsyncModuleMode } from 'app/enums/rsync-mode.enum';

export default {
  // configure_rsync service
  rsyncd_port_placeholder: T('TCP Port'),
  rsyncd_port_tooltip: T('<b>rsyncd</b> listens on this port.'),

  rsyncd_auxiliary_placeholder: T('Auxiliary Parameters'),
  rsyncd_auxiliary_tooltip: T('Enter any additional parameters from <a\
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>.'),

  // rsyncconfiguration-form
  rsyncmod_name_tooltip: T('Module name that matches the name requested by \
 the rsync client.'),
  rsyncmod_comment_tooltip: T('Describe this module.'),
  rsyncmod_enabled_tooltip: T('Activate this module for use with Rsync. Unset this \
field to deactivate the module without completely removing it.'),
  rsyncmod_path_tooltip: T('Browse to the pool or dataset to store received \
 data.'),
  rsyncmod_mode_options: [
    { label: T('Read Only'), value: RsyncModuleMode.ReadOnly },
    { label: T('Write Only'), value: RsyncModuleMode.WriteOnly },
    { label: T('Read and Write'), value: RsyncModuleMode.ReadAndWrite },
  ],
  rsyncmod_mode_tooltip: T('Choose permissions for this rsync module.'),
  rsyncmod_maxconn_tooltip: T('Maximum number of connections to this module. <i>0</i> \
 is unlimited.'),
  rsyncmod_user_tooltip: T('User to run as during file transfers to and from \
 this module.'),
  rsyncmod_group_tooltip: T('Group to run as during file transfers to and \
 from this module.'),
  rsyncmod_hostsallow_tooltip: T('From <a \
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html" \
 target="_blank">rsyncd.conf(5)</a>. A list of patterns to match with \
 the hostname and IP address of a connecting client. The connection is \
 rejected if no patterns match. Separate entries by pressing \
 <code>Enter</code>.'),
  rsyncmod_hostsdeny_tooltip: T('From <a \
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html" \
 target="_blank">rsyncd.conf(5)</a>. A list of patterns to match with \
 the hostname and IP address of a connecting client. The connection is \
 rejected when the patterns match. Separate entries by pressing \
 <code>Enter</code>.'),
};
