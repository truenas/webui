import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  bsdgrp_gid_tooltip: T('The Group ID (GID) is a unique number used to identify\
 a Unix group. Enter a number above 1000 for a group\
 with user accounts. Groups used by a service must have\
 an ID that matches the default port number used by the\
 service.'),

  bsdgrp_group_tooltip: T('Group name cannot begin with a hyphen\
 (<i>-</i>) or contain a space, tab, or these characters:\
 <i>, : + & # % ^ ( ) ! @ ~ * ? < > =</i>. <i>$</i> can only be used\
 as the last character of the username.'),

  bsdgrp_sudo_tooltip: T('Allow group members to use <a\
 href="https://man7.org/linux/man-pages/man8/sudo.8.html"\
 target="_blank">sudo</a>. Group members are prompted\
 for their password when using <b>sudo</b>.'),

  allow_tooltip: T('<b>Not recommended.</b> Allow more than one group to\
 have the same group ID.'),

  smb_tooltip: T('Set to allow group to be used for Samba permissions and authentication.'),
};
