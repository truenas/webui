import { Validators } from '@angular/forms';
import { T } from 'app/translate-marker';

export const helptext_sharing_afp = {
  fieldset_general: T('General Options'),
  fieldset_permissions: ('Permissions'),
  fieldset_allow: T('Allow'),
  fieldset_deny: T('Deny'),
  fieldset_ro: T('Read Only'),
  fieldset_rw: T('Read/Write'),
  fieldset_hostsallow: T('Allow Hosts'),
  fieldset_hostsdeny: T('Deny Hosts'),
  fieldset_other: T('Other Options'),

  placeholder_user_or_group: T('User or Group'),

  column_name: T('Name'),
  column_path: T('Path'),
  column_comment: T('Description'),
  column_enabled: T('Enabled'),

  placeholder_path: T('Path'),
  tooltip_path: T(
    'Browse to the pool or dataset to share. Netatalk\
 does not fully support nesting additional pools,\
 datasets, or symbolic links beneath this path.',
  ),
  validators_path: [Validators.required],

  placeholder_name: T('Name'),
  tooltip_name: T(
    'The pool name that appears in the\
 <b>connect to server</b> dialog of the computer.',
  ),

  placeholder_comment: T('Description'),
  tooltip_comment: T('Optional description.'),

  placeholder_allow: T('Allow List'),
  tooltip_allow: T(
    'Comma-delimited list of allowed users and/or groups\
 where groupname begins with a @.\
 Note that adding an entry will deny\
 any user or group that is not specified.',
  ),

  placeholder_deny: T('Deny List'),
  tooltip_deny: T(
    'Comma-delimited list of allowed users and/or groups\
 where groupname begins with a @. Note that adding\
 an entry will allow any user or group that\
 is not specified.',
  ),

  placeholder_ro: T('Read Only Access'),
  tooltip_ro: T(
    'Comma-delimited list of users and/or groups who only\
 have read access where groupname begins with a @.',
  ),

  placeholder_rw: T('Read/Write Access'),
  tooltip_rw: T(
    'Comma-delimited list of users and/or groups\
 who have read and write access where groupname\
 begins with a @.',
  ),

  placeholder_timemachine: T('Time Machine'),
  tooltip_timemachine: T(
    'Set to advertise TrueNAS as a Time\
 Machine disk so it can be found by Macs.\
 Setting multiple shares for <b>Time Machine</b> use\
 is not recommended. When multiple Macs share the\
 same pool, low disk space issues and intermittently\
 failed backups can occur.',
  ),

  placeholder_timemachine_quota: T('Time Machine Quota'),
  tooltip_timemachine_quota: T(
    'Quota for each Time Machine backup on this share (in GiB).\
 Note that this change will be applied only after\
 share re-mount.',
  ),

  placeholder_home: T('Use as Home Share'),
  tooltip_home: T(
    'Set to allow the share to host user\
 home directories. Only one share can be the home\
 share.',
  ),

  placeholder_enabled: T('Enabled'),
  tooltip_enabled: T('Enable this AFP share. Unset to disable this AFP share \
 without deleting it.'),

  placeholder_nodev: T('Zero Device Numbers'),
  tooltip_nodev: T(
    'Enable when the device number is inconstant across\
 a reboot.',
  ),

  placeholder_nostat: T('No Stat'),
  tooltip_nostat: T(
    'If set, AFP does not stat the pool path when\
 enumerating the pools list. This is useful for\
 automounting or pools created by a preexec script.',
  ),

  placeholder_upriv: T('AFP3 Unix Privs'),
  tooltip_upriv: T(
    'Enable Unix privileges supported by OSX 10.5 and\
 higher. Do not enable this if the network contains\
 Mac OSX 10.4 clients or lower as they do not\
 support this feature.',
  ),

  placeholder_fperm: T('File Permissions'),
  tooltip_fperm: T(
    'Only works with Unix ACLs. New files created on the\
 share are set with the selected permissions.',
  ),

  placeholder_dperm: T('Directory Permissions'),
  tooltip_dperm: T(
    'Only works with Unix ACLs.\
 New directories created on the share are set with\
 the selected permissions.',
  ),

  placeholder_umask: T('Default Umask'),
  tooltip_umask: T(
    'Umask is used for newly created files.\
 Default is <i>000</i>\
 (anyone can read, write, and execute).',
  ),

  tooltip_hostsallow: T('Allow hostnames or IP addresses to connect to the \
 share. Click <i>ADD</i> to add multiple entries. <br><br> \
 If neither *Allow Hosts* or *Deny Hosts* contains \
 an entry, then AFP share access is allowed for any host. <br><br> \
 If there is a *Allow Hosts* list but no *Deny Hosts* list, then only allow \
 hosts on the *Allow Hosts* list. <br><br> \
 If there is a *Deny Hosts* list but no *Allow Hosts* list, then allow all \
 hosts that are not on the *Deny Hosts* list. <br><br> \
 If there is both a *Allow Hosts* and *Deny Hosts* list, then allow all hosts \
 that are on the *Allow Hosts* list. <br><br> \
 If there is a host not on the *Allow Hosts* and not on the *Deny Hosts* list, \
 then allow it.'),

  tooltip_hostsdeny: T('Deny hostnames or IP addresses access to the share. \
  Click <i>ADD</i> to add multiple entries. <br><br> \
  If neither *Allow Hosts* or *Deny Hosts* contains \
  an entry, then AFP share access is allowed for any host. <br><br> \
  If there is a *Allow Hosts* list but no *Deny Hosts* list, then only allow \
  hosts on the *Allow Hosts* list. <br><br> \
  If there is a *Deny Hosts* list but no *Allow Hosts* list, then allow all \
  hosts that are not on the *Deny Hosts* list. <br><br> \
  If there is both a *Allow Hosts* and *Deny Hosts* list, then allow all hosts \
  that are on the *Allow Hosts* list. <br><br> \
  If there is a host not on the *Allow Hosts* and not on the *Deny Hosts* list, \
  then allow it.'),

  tooltip_auxparams: T(
    'Additional\
 <a href="http://netatalk.sourceforge.net/3.1/htmldocs/afp.conf.5.html"\
 target="_blank">afp.conf</a> parameters not covered\
 by other option fields.',
  ),

  smb_dialog: {
    title: T('Recommendation'),
    message: T('Beginning in 2013, Apple began using the SMB sharing protocol as the default option \
   for file sharing and ceased development of the AFP sharing protocol. It is recommended to use \
   SMB sharing over AFP unless files will be shared with legacy Apple products.'),
    button: T('Continue with AFP Setup'),
    custBtn: T('Create an SMB Share'),
  },

};
