import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextAcl = {
  tagTooltip: T('Access Control Entry (ACE) user or group.\
 Select a specific <i>User</i> or <i>Group</i> for this entry,\
 <i>owner@</i> to apply this entry to the user that owns the dataset,\
 <i>group@</i> to apply this entry to the group that owns the dataset,\
 or <i>everyone@</i> to apply this entry to all users and groups. See\
 <a href="https://man7.org/linux/man-pages/man1/nfs4_setfacl.1.html" target="_blank">nfs4_setfacl(1) NFSv4 ACL ENTRIES</a>.'),

  typeTooltip: T('How the <i>Permissions</i> are applied to\
 the chosen <i>Who</>. Choose <i>Allow</i> to grant the specified\
 permissions and <i>Deny</i> to restrict the specified permissions.'),

  permissionTypeTooltip: T('Choose the type of permissions.\
 <i>Basic</i> shows general permissions. <i>Advanced</i> shows each\
 specific type of permission for finer control.'),

  userTooltip: T('User account to which this ACL entry\
 applies.'),

  groupTooltip: T('Group to which this ACL entry applies.'),

  applyTooltip: T('Confirm changes to <i>User</i>. To prevent errors, changes to the <i>User</i> \
are submitted only when this box is set.'),

  applyGroupTooltip: T('Confirm changes to <i>Group</i>. To prevent errors, changes to the <i>Group</i> \
are submitted only when this box is set.'),

  permissionsTooltip: T('Select permissions to apply to the chosen\
 <i>Who</i>. Choices change depending on the <i>Permissions Type</i>.'),

  flagsTypeTooltip: T('Select the set of ACE inheritance\
 <i>Flags</i> to display. <i>Basic</i> shows nonspecific inheritance\
 options. <i>Advanced</i> shows specific inheritance settings for finer\
 control.'),

  flagsTooltip: T('How this ACE is applied to newly created\
 directories and files within the dataset. Basic flags enable or disable\
 ACE inheritance. Advanced flags allow further control of how the ACE\
 is applied to files and directories in the dataset.'),

  applyRecursivelyLabel: T('Apply permissions recursively'),
  applyRecursivelyTooltip: T('Apply permissions recursively to all\
 directories and files in the current dataset.'),

  traverseLabel: T('Apply permissions to child datasets'),
  traverseTooltip: T('Apply permissions recursively to all child datasets of the current dataset.'),

  warningTitle: T('Warning'),

  recursiveDialogTitle: T('Warning'),
  recursiveDialogMessage: T('Setting permissions\
 recursively affects this directory and any others below it. This can\
 make data inaccessible.'),

  stripAclDialog: {
    title: T('Strip ACLs'),
    message: T('This action removes all ACLs from the current \
 dataset and any directories or files contained within this \
 dataset. Stripping the ACL resets dataset permissions. This \
 can make data inaccessible until new permissions are created.'),
    traverseCheckbox: T('Remove the ACL and permissions from child datasets of the current dataset'),
    warning: T('Removes the ACL and permissions recursively \
 from all child datasets of the current dataset, including all directories and files contained within those child datasets. This can make data inaccessible until new permissions are created.'),
  },

  topLevelDialogMessage: T('Editing top-level datasets can\
 prevent users from accessing data in child datasets.'),

  typeDialog: {
    selectPreset: T('Select a preset ACL'),
    selectPresetTooltip: T('Choosing an entry loads a preset ACL that is \
 configured to match general permissions situations.'),
    createCustom: T('Create a custom ACL'),
    message: T('The chosen preset ACL will <strong>REPLACE</strong> the ACL currently displayed in the form \
 and delete any unsaved changes.'),
  },

  saveDialog: {
    title: T('Updating ACL'),
    message: T('This process continues in the background after closing this dialog.'),
  },

};
