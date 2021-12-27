import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  nfsAclTagLabels, nfsAclTypeLabels,
  NfsAdvancedFlag, nfsAdvancedPermissionLabels,
  NfsBasicFlag, nfsBasicPermissionLabels,
} from 'app/enums/nfs-acl.enum';
import { posixAclTagLabels, PosixPermission } from 'app/enums/posix-acl.enum';
import { getManPageLink } from 'app/helpers/man-page.utils';
import { mapToOptions } from 'app/helpers/options.helper';
import {
  NfsFormFlagsType,
  NfsFormPermsType,
} from 'app/pages/storage/volumes/permissions/components/edit-nfs-ace/edit-nfs-ace-form-values.interface';

export default {
  dataset_acl_title_file: T('File Information'),
  dataset_acl_title_entry: T('Access Control Entry'),
  dataset_acl_title_advanced: T('Advanced'),

  dataset_acl_path_placeholder: T('Path'),

  dataset_acl_aces_placeholder: T('Access Control Entries'),

  dataset_acl_tag_placeholder: T('Who'),
  dataset_acl_tag_tooltip: T(`Access Control Entry (ACE) user or group.
 Select a specific <i>User</i> or <i>Group</i> for this entry,
 <i>owner@</i> to apply this entry to the user that owns the dataset,
 <i>group@</i> to apply this entry to the group that owns the dataset,
 or <i>everyone@</i> to apply this entry to all users and groups. See
 ${getManPageLink('setfacl(1)')}.`),
  dataset_acl_tag_options: mapToOptions(nfsAclTagLabels),

  dataset_acl_type_placeholder: T('ACL Type'),
  dataset_acl_type_tooltip: T('How the <i>Permissions</i> are applied to\
 the chosen <i>Who</>. Choose <i>Allow</i> to grant the specified\
 permissions and <i>Deny</i> to restrict the specified permissions.'),
  dataset_acl_type_options: mapToOptions(nfsAclTypeLabels),

  dataset_acl_perms_set_title: T('Permissions'),
  dataset_acl_perms_type_placeholder: T('Permissions Type'),
  dataset_acl_perms_type_tooltip: T('Choose the type of permissions.\
 <i>Basic</i> shows general permissions. <i>Advanced</i> shows each\
 specific type of permission for finer control.'),
  dataset_acl_perms_type_options: [
    { label: T('Basic'), value: NfsFormPermsType.Basic },
    { label: T('Advanced'), value: NfsFormPermsType.Advanced },
  ],

  dataset_acl_user_placeholder: T('User'),
  dataset_acl_user_tooltip: T('User account to which this ACL entry\
 applies.'),

  dataset_acl_group_placeholder: T('Group'),
  dataset_acl_group_tooltip: T('Group to which this ACL entry applies.'),

  dataset_acl_uid_placeholder: T('User'),
  dataset_acl_uid_tooltip: T('User who controls the dataset. This user\
 always has permissions to read or write the ACL and read or write\
 attributes. Users created manually or imported from a directory service\
 appear in the drop-down menu.'),

  apply_user: {
    placeholder: T('Apply User'),
    tooltip: T('Confirm changes to <i>User</i>. To prevent errors, changes to the <i>User</i> \
are submitted only when this box is set.'),
  },

  dataset_acl_gid_placeholder: T('Group'),
  dataset_acl_gid_tooltip: T('The group which controls the dataset. This\
 group has the same permissions as granted to the <i>group@</i>\
 <i>Who</i>. Groups created manually or imported from a directory\
 service appear in the drop-down menu.'),

  apply_group: {
    placeholder: T('Apply Group'),
    tooltip: T('Confirm changes to <i>Group</i>. To prevent errors, changes to the <i>Group</i> \
are submitted only when this box is set.'),
  },

  dataset_acl_perms_placeholder: T('Permissions'),
  dataset_acl_perms_tooltip: T('Select permissions to apply to the chosen\
 <i>Who</i>. Choices change depending on the <i>Permissions Type</i>.'),
  dataset_acl_basic_perms_options: [
    ...mapToOptions(nfsBasicPermissionLabels),
    {
      label: T('Other (Too complicated to be displayed)'),
      value: 'OTHER',
      disable: true,
      hiddenFromDisplay: true,
    },
  ],
  dataset_acl_basic_perms_other_warning: T('These permissions are too complicated to be displayed and cannot be saved unless changed.'),
  dataset_acl_advanced_perms_options: mapToOptions(nfsAdvancedPermissionLabels),

  dataset_acl_flags_set_title: T('Flags'),
  dataset_acl_flags_type_placeholder: T('Flags Type'),
  dataset_acl_flags_type_tooltip: T('Select the set of ACE inheritance\
 <i>Flags</i> to display. <i>Basic</i> shows nonspecific inheritance\
 options. <i>Advanced</i> shows specific inheritance settings for finer\
 control.'),
  dataset_acl_flags_type_options: [
    { label: T('Basic'), value: NfsFormFlagsType.Basic },
    { label: T('Advanced'), value: NfsFormFlagsType.Advanced },
  ],

  dataset_acl_flags_placeholder: T('Flags'),
  dataset_acl_flags_tooltip: T('How this ACE is applied to newly created\
 directories and files within the dataset. Basic flags enable or disable\
 ACE inheritance. Advanced flags allow further control of how the ACE\
 is applied to files and directories in the dataset.'),
  dataset_acl_basic_flags_options: [
    { label: T('Inherit'), value: NfsBasicFlag.Inherit },
    { label: T('No Inherit'), value: NfsBasicFlag.NoInherit },
    {
      label: T('Other (Too complicated to be displayed)'),
      value: 'OTHER',
      disable: true,
      hiddenFromDisplay: true,
    },
  ],
  dataset_acl_advanced_flags_options: [
    { label: T('File Inherit'), value: NfsAdvancedFlag.FileInherit },
    { label: T('Directory Inherit'), value: NfsAdvancedFlag.DirectoryInherit },
    { label: T('No Propagate Inherit'), value: NfsAdvancedFlag.NoPropagateInherit },
    { label: T('Inherit Only'), value: NfsAdvancedFlag.InheritOnly },
    { label: T('Inherited'), value: NfsAdvancedFlag.Inherited },
  ],

  dataset_acl_recursive_placeholder: T('Apply permissions recursively'),
  dataset_acl_recursive_tooltip: T('Apply permissions recursively to all\
 directories and files in the current dataset.'),

  dataset_acl_traverse_placeholder: T('Apply permissions to child datasets'),
  dataset_acl_traverse_tooltip: T('Apply permissions recursively to all child datasets of the current dataset.'),

  dataset_acl_dialog_warning: T('Warning'),
  dataset_acl_dialog_warning_message: T('Changing dataset permission mode\
 can severely affect existing permissions.'),

  dataset_acl_recursive_dialog_warning: T('Warning'),
  dataset_acl_recursive_dialog_warning_message: T('Setting permissions\
 recursively affects this directory and any others below it. This can\
 make data inaccessible.'),

  dataset_acl_stripacl_placeholder: T('Strip ACLs'),
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

  dataset_acl_stripacl_dialog_warning: T('Warning'),
  dataset_acl_stripacl_dialog_warning_message: T('Stripping the ACL resets\
 dataset permissions. This can make data inaccessible until new\
 permissions are created.'),

  dataset_acl_toplevel_dialog_message: T('Editing top-level datasets can\
 prevent users from accessing data in child datasets.'),

  dataset_acl_add_item_btn: T('Add ACL Item'),

  user_not_found: T('Could not find a user name for this user ID.'),
  group_not_found: T('Could not find a group name for this group ID.'),

  empty_acl_dialog: {
    title: T('Error'),
    message: T('Cannot open this ACL. Check the permissions this dataset \
 has inherited from parents.'),
  },

  posix_perms: {
    placeholder: T('Permissions'),
    tooltip: T('Permissions'),
    options: [
      { label: T('Read'), value: PosixPermission.Read },
      { label: T('Write'), value: PosixPermission.Write },
      { label: T('Execute'), value: PosixPermission.Execute },
    ],
  },

  posix_tag: {
    placeholder: T('Who'),
    tooltip: T('Tag'),
    options: mapToOptions(posixAclTagLabels),
  },

  posix_default: {
    placeholder: T('Default'),
    tooltip: T('Default'),
  },

  permissions_editor_button: T('Use Permissions Editor'),

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

  preset_cust_action_btn: T('Select an ACL Preset'),

  save_dialog: {
    title: T('Updating Dataset ACL'),
    message: T('This process continues in the background after closing this dialog.'),
    abort_message: T('Clicking Continue allows TrueNAS to finish the update in the background while \
 Abort stops the process and reverts the dataset ACL to the previously active ACL.'),
  },

};
