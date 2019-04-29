import { T } from "../../../translate-marker";
import { Validators } from "@angular/forms";

export const helptext_sharing_nfs = {
  // NFSListComponent
  column_path: T("Path"),
  column_comment: T("Comment"),

  // NFSFormComponent
  placeholder_path: T("Path"),
  tooltip_path: T(
    "Full path to the pool or dataset to share. Mandatory.\
 Click <b>ADD ADDITIONAL PATH</b> to configure\
 multiple paths."
  ),
  validators_path: [Validators.required],

  placeholder_delete: T("Delete Path"),
  tooltip_delete: T("Delete this path."),

  placeholder_comment: T("Comment"),
  tooltip_comment: T(
    "Set the share name. If left empty, share name is the\
 list of selected <b>Path</b> entries."
  ),

  placeholder_alldirs: T("All dirs"),
  tooltip_alldirs: T(
    "Set to allow the client to mount any\
 subdirectory within the <b>Path</b>."
  ),

  placeholder_ro: T("Read Only"),
  tooltip_ro: T("Set to prohibit writing to the share."),

  placeholder_quiet: T("Quiet"),
  tooltip_quiet: T(
    'Set to inhibit some syslog diagnostics\
 to avoid error messages. See\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=exports"\
 target="_blank">exports(5)</a> for examples.'
  ),

  placeholder_network: T("Authorized Networks"),
  tooltip_network: T(
    "Space-delimited list of allowed networks in\
 network/mask CIDR notation.\
 Example: <i>1.2.3.0/24</i>. Leave empty\
 to allow all."
  ),

  placeholder_hosts: T("Authorized Hosts and IP addresses"),
  tooltip_hosts: T(
    "Space-delimited list of allowed IP addresses\
 <i>(192.168.1.10)</i> or hostnames\
 <i>(www.freenas.com)</i>. Leave empty to allow all."
  ),

  placeholder_maproot_user: T("Maproot User"),
  tooltip_maproot_user: T(
    "When a user is selected, the <i>root</i> user is\
 limited to the permissions of that user."
  ),

  placeholder_maproot_group: T("Maproot Group"),
  tooltip_maproot_group: T(
    "When a group is selected, the <i>root</i> user is also\
 limited to the permissions of that group."
  ),

  placeholder_mapall_user: T("Mapall User"),
  tooltip_mapall_user: T(
    "The specified permissions of that user are used\
 by all clients."
  ),

  placeholder_mapall_group: T("Mapall Group"),
  tooltip_mapall_group: T(
    "The specified permissions of that group are used\
 by all clients."
  ),

  placeholder_security: T("Security"),

  actions_add_path: T("Add Additional Path"),
  actions_remove_path: T("Remove Additional Path"),

  actions_basic_mode: T("Basic Mode"),
  actions_advanced_mode: T("Advanced Mode"),

  dialog_enable_service_title: T("Enable service"),
  dialog_enable_service_message: T("Enable this service?"),
  dialog_enable_service_button: T("Enable Service"),

  snackbar_service_started: T("Service started"),
  snackbar_close: T("close")
};
