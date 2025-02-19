import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSharingNfs = {
  root_level_warning: T(
    'Configuring NFS exports of root-level datasets\
 may lead to storage reconfiguration issues.\
 Consider creating a dataset instead.',
  ),

  // NFSFormComponent
  tooltip_path: T('Full path to the pool, dataset or directory to share. \
  The path must reside within a pool. Mandatory.'),
  error_alias: T('The <i>Alias</i> field can either be left empty or \
 have an alias defined for each path in the share.'),
  tooltip_comment: T(
    'Provide helpful notations related to the share, e.g. ‘Shared to everybody’. \
    Maximum length is 120 characters.',
  ),
  tooltip_alldirs: T(
    'Set to allow the client to mount any\
 subdirectory within the <b>Path</b>.',
  ),
  tooltip_ro: T('Set to prohibit writing to the share.'),
  tooltip_quiet: T(
    'Set to inhibit some syslog diagnostics\
 to avoid error messages. See\
 <a href="https://man7.org/linux/man-pages/man5/exports.5.html"\
 target="_blank">exports(5)</a> for examples.',
  ),
  tooltip_enabled: T('Enable this NFS share. Unset to disable this NFS share \
 without deleting it.'),
  tooltip_expose_snapshots: T('Allow accessing ZFS snapshots over the NFS protocol.'),
  tooltip_networks_wrapper: T(
    'Click "Add" to specify NFS client network ranges for this share.\
 If both networks and hosts are empty the share will be exported to everyone.',
  ),
  tooltip_network: T(
    'Allowed network in network/mask CIDR notation (example <i>1.2.3.4/24<i>).\
     One entry per field. Leave empty to allow everybody.',
  ),
  tooltip_hosts: T(
    'Allowed IP address or hostname. One entry per field. Leave empty to allow everybody.',
  ),
  tooltip_hosts_wrapper: T(
    'Click "Add" to specify NFS client hosts for this share.\
 If both networks and hosts are empty the share will be exported to everyone.',
  ),
  tooltip_maproot_user: T(
    'When a user is selected, the <i>root</i> user is\
 limited to the permissions of that user.',
  ),
  tooltip_maproot_group: T(
    'When a group is selected, the <i>root</i> user is also\
 limited to the permissions of that group.',
  ),
  tooltip_mapall_user: T(
    'The specified permissions of that user are used\
 by all clients.',
  ),
  tooltip_mapall_group: T(
    'The specified permissions of that group are used\
 by all clients.',
  ),
  tooltip_security: T(
    'Specifies level of authentication and cryptographic protection.\
 SYS or none should be used if no KDC is available. If a KDC is available, e.g. Active Directory, KRB5 is recommended.\
 If desired KRB5I (integrity protection) and/or KRB5P (privacy protection) may be included with KRB5.',
  ),
};
