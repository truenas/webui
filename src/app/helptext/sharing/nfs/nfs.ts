import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSharingNfs = {
  root_level_warning: T(
    'Configuring NFS exports of root-level datasets\
 may lead to storage reconfiguration issues.\
 Consider creating a dataset instead.',
  ),

  pathTooltip: T('Full path to the pool, dataset or directory to share. \
  The path must reside within a pool. Mandatory.'),
  exposeTooltip: T('Allow accessing ZFS snapshots over the NFS protocol.'),
  addNetworkTooltip: T(
    'Click "Add" to specify NFS client network ranges for this share.\
 If both networks and hosts are empty the share will be exported to everyone.',
  ),
  hostsTooltip: T(
    'Allowed IP address or hostname. One entry per field. Leave empty to allow everybody.',
  ),
  addHostsTooltip: T(
    'Click "Add" to specify NFS client hosts for this share.\
 If both networks and hosts are empty the share will be exported to everyone.',
  ),
  maprootUserTooltip: T(
    'When a user is selected, the <i>root</i> user is\
 limited to the permissions of that user.',
  ),
  maprootGroupTooltip: T(
    'When a group is selected, the <i>root</i> user is also\
 limited to the permissions of that group.',
  ),
  mapallUserTooltip: T(
    'The specified permissions of that user are used\
 by all clients.',
  ),
  mapallGroupTooltip: T(
    'The specified permissions of that group are used\
 by all clients.',
  ),
  securityTooltip: T(
    'Specifies level of authentication and cryptographic protection.\
 SYS or none should be used if no KDC is available. If a KDC is available, e.g. Active Directory, KRB5 is recommended.\
 If desired KRB5I (integrity protection) and/or KRB5P (privacy protection) may be included with KRB5.',
  ),
};
