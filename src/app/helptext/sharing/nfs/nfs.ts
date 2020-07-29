import { T } from "../../../translate-marker";
import { Validators } from "@angular/forms";

export const helptext_sharing_nfs = {
  // NFSListComponent
  column_path: T("Path"),
  column_comment: T("Description"),
  column_enabled: T("Enabled"),

  // NFSFormComponent
  fieldset_paths: T('Paths'),
  fieldset_general: T('General Options'),
  fieldset_access: T('Access'),
  fieldset_networks: T('Networks'),
  fieldset_hosts: T('Hosts'),

  placeholder_path: T("Path"),
  tooltip_path: T(
    "Full path to the pool or dataset to share. Mandatory.\
 Click <b>ADD ADDITIONAL PATH</b> to configure\
 multiple paths."
  ),
  validators_path: [Validators.required],

  placeholder_alias: T("Alias"),
  tooltip_alias: T('To define a custom shortcut for the <i>Path</i>, \
 enter a memorable name. Example: <i>/nfsshare</i>. NFS clients \
 can connect using the <i>Alias</i> instead of the <i>Path</i> \
 when the share is active. A share with multiple paths requires \
 either not using aliases or defining an alias for each path in \
 the share.'),
  error_alias: T('The <i>Alias</i> field can either be left empty or \
 have an alias defined for each path in the share.'),

  placeholder_delete: T("Delete Path"),
  tooltip_delete: T("Delete this path."),

  placeholder_comment: T("Description"),
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

  placeholder_enabled: T('Enabled'),
  tooltip_enabled: T('Enable this NFS share. Unset to disable this NFS share \
 without deleting it.'),

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

};
