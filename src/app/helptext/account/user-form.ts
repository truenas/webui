import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextUsers = {
  user_form_full_name_tooltip: T('Spaces are allowed.'),
  user_form_username_tooltip: T('Usernames can be up to 32 characters long.\
 Usernames cannot begin with a hyphen (<i>-</i>) or contain a space,\
 tab, or these characters:\
 <i>, : + & # % ^ ( ) ! @ ~ * ? < > =</i>. <i>$</i> can only be\
 used as the last character of the username.'),
  user_form_email_tooltip: T('Enter the email address of the new user.'),
  user_form_password_tooltip: T('Required unless <b>Enable password login</b> is\
 <i>No</i>. Passwords cannot contain a <b>?</b>.'),
  user_form_password_edit_tooltip: T('Required unless <b>Enable password login</b> is\
 <i>No</i>. Passwords cannot contain a <b>?</b>.'),
  user_form_uid_tooltip: T('User accounts have an ID greater than 1000 and\
 system accounts have an ID equal to the default\
 port number used by the service.'),
  user_form_group_create_tooltip: T('Set to create a new primary group with the same name as\
 the user. Unset to select an existing group for the user.'),
  user_form_primary_group_tooltip: T('New users are not given <b>su</b> permissions if\
 <i>wheel</i> is their primary group.'),
  user_form_aux_groups_tooltip: T('Add this user to additional groups.'),
  user_form_dirs_explorer_tooltip: T('Choose a path to the user\'s\
 home directory. If the directory exists and matches the username,\
 it is set as the user\'s home directory. When the path does not\
 end with a subdirectory matching the username, a new subdirectory is\
 created only if the \'Create Home Directory\' field is marked checked.\
 The full path to the user\'s home directory is shown\
 here when editing a user.'),
  user_form_home_dir_permissions_tooltip: T('Sets default Unix permissions of the user home\
 directory. This is read-only for built-in users.'),
  user_form_home_create_tooltip: T('Create a new home directory for user within the selected path.'),
  user_form_auth_sshkey_tooltip: T('Enter or paste the <b>public</b> SSH key of the\
 user for any key-based authentication. <b>Do not paste the private key.</b>'),
  user_form_auth_pw_enable_tooltip: T('<i>Yes:</i> Disables the <b>Password</b> \
 fields. The account cannot \
 use password-based logins for services. For example, disabling the \
 password prevents using account credentials to log in to an SMB share \
 or open an SSH session on the system. The <b>Lock User</b> and \
 <b>Permit Sudo</b> options are also removed.<br><br> \
 <i>No:</i> Requires adding a <b>Password</b> to the account. The \
 account can use the saved <b>Password</b> to authenticate with \
 password-based services.'),
  user_form_shell_tooltip: T('Select the shell to use for local and SSH logins.'),
  user_form_lockuser_tooltip: T('Prevent the user from logging in or \
 using password-based services until this option is unset. Locking an \
 account is only possible when <b>Disable Password</b> is <i>No</i> and \
 a <b>Password</b> has been created for the account.'),
  user_form_smb_tooltip: T('Set to allow user to authenticate to Samba shares.'),
  smbBuiltin: T('Cannot be enabled for built-in users.'),
};
