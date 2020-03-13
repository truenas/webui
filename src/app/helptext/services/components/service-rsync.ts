import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';

export default {
rsyncd_fieldset_name: T('Name'),
rsyncd_fieldset_path: T('Path'),
rsyncd_fieldset_access: T('Access'),
rsyncd_fieldset_other: T('Other Options'),

// configure_rsync service
rsyncd_port_placeholder :T( 'TCP Port'),
rsyncd_port_tooltip: T('<b>rsyncd</b> listens on this port.'),
rsyncd_port_value: '873',

rsyncd_auxiliary_placeholder : T('Auxiliary parameters'),
rsyncd_auxiliary_tooltip: T('Enter any additional parameters from <a\
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>.'),

// rsyncconfiguration-form
rsyncmod_name_placeholder: T('Name'),
rsyncmod_name_tooltip: T('Module name that matches the name requested by \
 the rsync client.'),
rsyncmod_name_validation: Validators.required,

rsyncmod_comment_placeholder: T('Comment'),
rsyncmod_comment_tooltip: T('Describe this module.'),

rsyncmod_path_placeholder: T('Path'),
rsyncmod_path_tooltip: T('Browse to the pool or dataset to store received \
 data.'),
rsyncmod_path_validation: Validators.required,

rsyncmod_mode_placeholder: T('Access Mode'),
rsyncmod_mode_options: [
    { label: T('Read Only'), value:'RO' },
    { label: T('Write Only'), value:'WO' },
    { label: T('Read and Write'), value:'RW' },
],
rsyncmod_mode_tooltip: T('Choose permissions for this rsync module.'),

rsyncmod_maxconn_placeholder: T('Maximum connections'),
rsyncmod_maxconn_value: 0,
rsyncmod_maxconn_validation: Validators.min(0),
rsyncmod_maxconn_tooltip: T('Maximum connections to this module. <i>0</i> \
 is unlimited.'),

rsyncmod_user_placeholder: T('User'),
rsyncmod_user_tooltip: T('User to run as during file transfers to and from \
 this module.'),

rsyncmod_group_placeholder: T('Group'),
rsyncmod_group_tooltip: T('Group to run as during file transfers to and \
 from this module.'),

rsyncmod_hostsallow_placeholder: T('Hosts Allow'),
rsyncmod_hostsallow_tooltip: T('From <a \
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html" \
 target="_blank">rsyncd.conf(5)</a>. A list of patterns to match with \
 the hostname and IP address of a connecting client. The connection is \
 rejected if no patterns match. Separate patterns with whitespace or a \
 comma.'),

rsyncmod_hostsdeny_placeholder: T('Hosts Deny'),
rsyncmod_hostsdeny_tooltip: T('From <a \
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html" \
 target="_blank">rsyncd.conf(5)</a>. A list of patterns to match with \
 the hostname and IP address of a connecting client. The connection is \
 rejected when the patterns match. Separate patterns with whitespace \
 or a comma.'),

rsyncmod_auxiliary_placeholder: T('Auxiliary parameters'),
rsyncmod_auxiliary_tooltip: T('Enter any additional settings from <a\
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>.'),

}
