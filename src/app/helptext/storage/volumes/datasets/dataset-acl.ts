import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextAcl = {
  dataset_acl_tag_tooltip: T('Access Control Entry (ACE) user or group.\
 Select a specific <i>User</i> or <i>Group</i> for this entry,\
 <i>owner@</i> to apply this entry to the user that owns the dataset,\
 <i>group@</i> to apply this entry to the group that owns the dataset,\
 or <i>everyone@</i> to apply this entry to all users and groups. See\
 <a href="https://man7.org/linux/man-pages/man1/nfs4_setfacl.1.html" target="_blank">nfs4_setfacl(1) NFSv4 ACL ENTRIES</a>.'),

  dataset_acl_type_tooltip: T('How the <i>Permissions</i> are applied to\
 the chosen <i>Who</>. Choose <i>Allow</i> to grant the specified\
 permissions and <i>Deny</i> to restrict the specified permissions.'),

  dataset_acl_perms_type_tooltip: T('Choose the type of permissions.\
 <i>Basic</i> shows general permissions. <i>Advanced</i> shows each\
 specific type of permission for finer control.'),

  dataset_acl_user_tooltip: T('User account to which this ACL entry\
 applies.'),

  dataset_acl_group_tooltip: T('Group to which this ACL entry applies.'),

  dataset_acl_uid_tooltip: T('User who controls the dataset. This user\
 always has permissions to read or write the ACL and read or write\
 attributes. Users created manually or imported from a directory service\
 appear in the drop-down menu.'),

  apply_user: {
    tooltip: T('Confirm changes to <i>User</i>. To prevent errors, changes to the <i>User</i> \
are submitted only when this box is set.'),
  },

  dataset_acl_gid_tooltip: T('The group which controls the dataset. This\
 group has the same permissions as granted to the <i>group@</i>\
 <i>Who</i>. Groups created manually or imported from a directory\
 service appear in the drop-down menu.'),

  apply_group: {
    tooltip: T('Confirm changes to <i>Group</i>. To prevent errors, changes to the <i>Group</i> \
are submitted only when this box is set.'),
  },

  dataset_acl_perms_tooltip: T('Select permissions to apply to the chosen\
 <i>Who</i>. Choices change depending on the <i>Permissions Type</i>.'),

  dataset_acl_flags_type_tooltip: T('Select the set of ACE inheritance\
 <i>Flags</i> to display. <i>Basic</i> shows nonspecific inheritance\
 options. <i>Advanced</i> shows specific inheritance settings for finer\
 control.'),

  dataset_acl_flags_tooltip: T('How this ACE is applied to newly created\
 directories and files within the dataset. Basic flags enable or disable\
 ACE inheritance. Advanced flags allow further control of how the ACE\
 is applied to files and directories in the dataset.'),

  dataset_acl_recursive_placeholder: T('Apply permissions recursively'),
  dataset_acl_recursive_tooltip: T('Apply permissions recursively to all\
 directories and files in the current dataset.'),

  dataset_acl_traverse_placeholder: T('Apply permissions to child datasets'),
  dataset_acl_traverse_tooltip: T('Apply permissions recursively to all child datasets of the current dataset.'),

  dataset_acl_validate_placeholder: T('Validate effective ACL'),
  dataset_acl_validate_tooltip: T('Ensure that ACL permissions are validated for all users and groups.\
 Disabling this may allow configurations that do not provide the intended access. \
 It is recommended to keep this option enabled.'),

  dataset_acl_dialog_warning: T('Warning'),
  dataset_acl_dialog_warning_message: T('Changing dataset permission mode\
 can severely affect existing permissions.'),

  dataset_acl_recursive_dialog_warning: T('Warning'),
  dataset_acl_recursive_dialog_warning_message: T('Setting permissions\
 recursively affects this directory and any others below it. This can\
 make data inaccessible.'),

  dataset_acl_stripacl_tooltip: T('Set to remove all ACLs from the current\
 dataset. ACLs are also recursively stripped from directories and child\
 datasets when those options are set.'),

  stripACL_dialog: {
    title: T('Strip ACLs'),
    message: T('This action removes all ACLs from the current \
 dataset and any directories or files contained within this \
 dataset. Stripping the ACL resets dataset permissions. This \
 can make data inaccessible until new permissions are created.'),
    traverse_checkbox: T('Remove the ACL and permissions from child datasets of the current dataset'),
    warning: T('Removes the ACL and permissions recursively \
 from all child datasets of the current dataset, including all directories and files contained within those child datasets. This can make data inaccessible until new permissions are created.'),

  },

  dataset_acl_toplevel_dialog_message: T('Editing top-level datasets can\
 prevent users from accessing data in child datasets.'),

  posix_perms: {
    placeholder: T('Permissions'),
    tooltip: T('Permissions'),
  },

  posix_tag: {
    placeholder: T('Who'),
    tooltip: T('Tag'),
  },

  posix_default: {
    placeholder: T('Default'),
    tooltip: T('Default'),
  },

  type_dialog: {
    title: T('Create an ACL'),
    radio_preset: T('Select a preset ACL'),
    radio_preset_tooltip: T('Choosing an entry loads a preset ACL that is \
 configured to match general permissions situations.'),
    radio_custom: T('Create a custom ACL'),
    input: {
      placeholder: T('Default ACL Options'),
    },
    message: T('The chosen preset ACL will <strong>REPLACE</strong> the ACL currently displayed in the form \
 and delete any unsaved changes.'),
  },

  save_dialog: {
    title: T('Updating ACL'),
    message: T('This process continues in the background after closing this dialog.'),
    abort_message: T('Clicking Continue allows TrueNAS to finish the update in the background while \
 Abort stops the process and reverts the dataset ACL to the previously active ACL.'),
  },

};
