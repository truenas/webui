import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextGroups = {
  bsdgrp_gid_tooltip: T('The Group ID (GID) is a unique number used to identify\
 a Unix group. Enter a number above 1000 for a group\
 with user accounts. Groups used by a service must have\
 an ID that matches the default port number used by the\
 service.'),

  bsdgrp_group_tooltip: T('Group name cannot begin with a hyphen\
 (<i>-</i>) or contain a space, tab, or these characters:\
 <i>, : + & # % ^ ( ) ! @ ~ * ? < > =</i>. <i>$</i> can only be used\
 as the last character of the username.'),

  privileges_tooltip: T('Attaches privileges to the group. Only needed if you need users in this group access \
 to TrueNAS API or WebUI.'),

  bsdgrp_sudo_tooltip: T('Allow group members to use <a\
 href="https://man7.org/linux/man-pages/man8/sudo.8.html"\
 target="_blank">sudo</a>. Group members are prompted\
 for their password when using <b>sudo</b>.'),

  smb_tooltip: T('Makes the group available for permissions editors over SMB protocol (and the share ACL \
    editor). It is not used for SMB authentication or determining the user session token or internal \
    permissions checks.'),
};
