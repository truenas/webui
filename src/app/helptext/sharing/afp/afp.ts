import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_sharing_afp = {
  placeholder_path: T("Path"),
  tooltip_path: T(
    "Browse to the pool or dataset to share. Netatalk\
 does not fully support nesting additional pools,\
 datasets, or symbolic links beneath this path."
  ),
  validators_path: [Validators.required],

  placeholder_name: T("Name"),
  tooltip_name: T(
    "The pool name that appears in the\
 <b>connect to server</b> dialog of the computer."
  ),

  placeholder_comment: T("Comment"),
  tooltip_comment: T("Optional comment."),

  placeholder_allow: T("Allow list"),
  tooltip_allow: T(
    "Comma-delimited list of allowed users and/or groups\
 where groupname begins with a @.\
 Note that adding an entry will deny\
 any user or group that is not specified."
  ),

  placeholder_deny: T("Deny list"),
  tooltip_deny: T(
    "Comma-delimited list of allowed users and/or groups\
 where groupname begins with a @. Note that adding\
 an entry will allow any user or group that\
 is not specified."
  ),

  placeholder_ro: T("Read Only Access"),
  tooltip_ro: T(
    "Comma-delimited list of users and/or groups who only\
 have read access where groupname begins with a @."
  ),

  placeholder_rw: T("Read/Write Access"),
  tooltip_rw: T(
    "Comma-delimited list of users and/or groups\
 who have read and write access where groupname\
 begins with a @."
  ),

  placeholder_timemachine: T("Time Machine"),
  tooltip_timemachine: T(
    "Set to advertise FreeNAS as a Time\
 Machine disk so it can be found by Macs.\
 Setting multiple shares for <b>Time Machine</b> use\
 is not recommended. When multiple Macs share the\
 same pool, low disk space issues and intermittently\
 failed backups can occur."
  ),

  placeholder_timemachine_quota: T("Time Machine Quota"),
  tooltip_timemachine_quota: T(
    "Quota for each Time Machine backup on this share (in GiB).\
 Note that this change will be applied only after\
 share re-mount."
  ),

  placeholder_home: T("Use as home share"),
  tooltip_home: T(
    "Set to allow the share to host user\
 home directories. Only one share can be the home\
 share."
  ),

  placeholder_nodev: T("Zero Device Numbers"),
  tooltip_nodev: T(
    "Enable when the device number is inconstant across\
 a reboot."
  ),

  placeholder_nostat: T("No Stat"),
  tooltip_nostat: T(
    "If set, AFP does not stat the pool path when\
 enumerating the pools list. This is useful for\
 automounting or pools created by a preexec script."
  ),

  placeholder_upriv: T("AFP3 Unix Privs"),
  tooltip_upriv: T(
    "Enable Unix privileges supported by OSX 10.5 and\
 higher. Do not enable this if the network contains\
 Mac OSX 10.4 clients or lower as they do not\
 support this feature."
  ),

  placeholder_fperm: T("Default file permissions"),
  tooltip_fperm: T(
    "Only works with Unix ACLs. New files created on the\
 share are set with the selected permissions."
  ),

  placeholder_dperm: T("Default directory permissions"),
  tooltip_dperm: T(
    "Only works with Unix ACLs.\
 New directories created on the share are set with\
 the selected permissions."
  ),

  placeholder_umask: T("Default umask"),
  tooltip_umask: T(
    "Unmask is used for newly created files.\
 Default is <i>000</i>\
 (anyone can read, write, and execute)."
  ),

  placeholder_hostsallow: T("Hosts Allow"),
  tooltip_hostsallow: T(
    "Comma-, space-, or tab-delimited list of allowed\
 hostnames or IP addresses."
  ),

  tooltip_hostsdeny: T(
    "Comma-, space-, tab-delimited list of denied\
 hostnames or IP addresses."
  ),

  tooltip_auxparams: T(
    'Additional\
 <a href="http://netatalk.sourceforge.net/3.1/htmldocs/afp.conf.5.html"\
 target="_blank">afp.conf</a> parameters not covered\
 by other option fields.'
  ),

  actions_basic_mode: T("Basic Mode"),
  actions_advanced_mode: T("Advanced Mode"),

  dialog_title: T("Enable service"),
  dialog_message: T("Enable this service?"),
  dialog_button: T("Enable Service"),

  snackbar_message: T("Service started"),
  snackbar_close: T("close")
};
