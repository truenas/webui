import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';

export default {
// configure_rsync service
rsyncd_port_placeholder :T( 'TCP Port'),
rsyncd_port_tooltip: T('<b>rsyncd</b> listens on this port.'),
rsyncd_port_value: '873',

rsyncd_auxiliary_placeholder : T('Auxiliary parameters'),
rsyncd_auxiliary_tooltip: T('Enter any additional parameters from <a\
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>.'),

// rsyncconfiguration-form
rsyncmod_name_placeholder: 'Name',
rsyncmod_name_tooltip: 'This <b>must</b> match the settings on the rsync client.',
rsyncmod_name_validation: Validators.required,

rsyncmod_comment_placeholder: 'Comment',
rsyncmod_comment_tooltip: 'Describe this module.',

rsyncmod_path_placeholder: 'Path',
rsyncmod_path_tooltip: 'Browse to the pool or dataset to store received data.',
rsyncmod_path_validation: Validators.required,

rsyncmod_mode_placeholder: 'Access Mode',
rsyncmod_mode_options: [
    { label: 'Read Only', value:'RO' },
    { label: 'Write Only', value:'WO' },
    { label: 'Read and Write', value:'RW' },
],
rsyncmod_mode_tooltip: 'Choose permissions for this rsync module.',

rsyncmod_maxconn_placeholder: 'Maximum connections',
rsyncmod_maxconn_value: 0,
rsyncmod_maxconn_validation: Validators.min(0),
rsyncmod_maxconn_tooltip: 'Enter the number of maximum connections to this module.\
 <i>0</i> is unlimited.',

rsyncmod_user_placeholder: 'User',
rsyncmod_user_tooltip: 'Select the user to conduct file transfers to and from this module.',

rsyncmod_group_placeholder: 'Group',
rsyncmod_group_tooltip: 'Select the group to conduct file transfers to and from this module.',

rsyncmod_hostsallow_placeholder: 'Hosts Allow',
rsyncmod_hostsallow_tooltip: 'From <a\
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>. Enter a list of\
 patterns to match with the hostname and IP address of\
 a connecting client. The connection is rejected if no\
 patterns match. Separate patterns with whitespace or a\
 comma.',

rsyncmod_hostsdeny_placeholder: 'Hosts Deny',
rsyncmod_hostsdeny_tooltip: 'From <a\
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>. Enter a list of\
 patterns to match with the hostname and IP address of\
 a connecting client. The connection is rejected when\
 the patterns match. Separate patterns with whitespace\
 or a comma.',

rsyncmod_auxiliary_placeholder: 'Auxiliary parameters',
rsyncmod_auxiliary_tooltip: 'Enter any additional settings from <a\
 href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>.',

}