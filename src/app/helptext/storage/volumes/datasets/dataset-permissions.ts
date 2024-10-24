import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextPermissions = {
  dataset_permissions_user_tooltip: T('Select the user to control the dataset. Users\
 created manually or imported from a directory service\
 appear in the drop-down menu.'),

  apply_user: {
    tooltip: T('Confirm changes to <i>User</i>. To prevent errors, changes to the <i>User</i> \
are submitted only when this box is set.'),
  },

  dataset_permissions_group_tooltip: T('Select the group to control the dataset. Groups\
 created manually or imported from a directory service\
 appear in the drop-down menu.'),

  apply_group: {
    tooltip: T('Confirm changes to <i>Group</i>. To prevent errors, changes to the <i>Group</i> \
are submitted only when this box is set.'),
  },

  dataset_permissions_mode_tooltip: T('Set the read, write, and execute permissions for the dataset.'),

  dataset_permissions_recursive_tooltip: T('Apply permissions recursively to all directories\
 and files within the current dataset.'),

  dataset_permissions_traverse_tooltip: T('Apply permissions recursively to all child datasets of the current dataset.'),

  editDisabled: {
    locked: T('Permissions cannot be modified on a locked dataset.'),
    readonly: T('Permissions cannot be modified on a read-only dataset.'),
    root: T('Permissions cannot be modified on a root dataset.'),
  },
};
