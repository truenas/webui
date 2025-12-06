import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextUsers = {
  usernameTooltip: T('Usernames can be up to 32 characters long.\
 Usernames cannot begin with a hyphen (<i>-</i>) or contain a space,\
 tab, or these characters:\
 <i>, : + & # % ^ ( ) ! @ ~ * ? < > =</i>. <i>$</i> can only be\
 used as the last character of the username.'),
  passwordTooltip: T('Longer passwords are more secure. Try using a phrase or a mix of words and numbers.'),
  passwordConfirmTooltip: T('Confirm the password by typing it again.'),
  uidTooltip: T('User accounts have an ID greater than 1000 and\
 system accounts have an ID equal to the default\
 port number used by the service.'),
  createGroupTooltip: T('Set to create a new primary group with the same name as\
 the user. Unset to select an existing group for the user.'),
  primaryGroupTooltip: T('New users are not given <b>su</b> permissions if\
 <i>wheel</i> is their primary group.'),
  auxGroupsTooltip: T('Add this user to additional groups.'),
  homeDirectoryExplorerTooltip: T('Choose a path to the user\'s\
 home directory. If the directory exists and matches the username,\
 it is set as the user\'s home directory. When the path does not\
 end with a subdirectory matching the username, a new subdirectory is\
 created only if the \'Create Home Directory\' field is marked checked.\
 The full path to the user\'s home directory is shown\
 here when editing a user.'),
  homeDirectoryPermissionsTooltip: T('Sets default Unix permissions of the user home\
 directory. This is read-only for built-in users.'),
  publicKeyTooltip: T('Enter or paste the <b>public</b> SSH key of the\
 user for any key-based authentication. <b>Do not paste the private key.</b>'),
  disablePasswordTooltip: T('<i>Yes:</i> Disables the <b>Password</b> \
 fields. The account cannot \
 use password-based logins for services. For example, disabling the \
 password prevents using account credentials to log in to an SMB share \
 or open an SSH session on the system. The <b>Lock User</b> and \
 <b>Permit Sudo</b> options are also removed.<br><br> \
 <i>No:</i> Requires adding a <b>Password</b> to the account. The \
 account can use the saved <b>Password</b> to authenticate with \
 password-based services.'),
  oneTimePasswordWarning: T('Once generated, one time-password is only valid for one login within 24 hours and does not persist across reboots. \
User will be required to set new password after they log in.<br><br> \
Do you want to continue?'),
  oneTimePasswordTooltip: T('Temporary password will be generated and shown to you once form is saved. \
 <br><br>This password is only valid for one login within 24 hours and does not persist across reboots. \
 <br><br>User will be encouraged to choose their own password after they login for the first time.'),
  shellTooltip: T('Select the shell to use for local and SSH logins.'),
  lockUserTooltip: T('Prevent the user from logging in or \
 using password-based services until this option is unset. Locking an \
 account is only possible when <b>Disable Password</b> is <i>No</i> and \
 a <b>Password</b> has been created for the account.'),
  smbTooltip: T('Set to allow user to authenticate to Samba shares.'),
  smbBuiltin: T('Cannot be enabled for built-in users.'),
  smbStig: T('Local user accounts using NTLM authentication are not permitted when TrueNAS is running in an enhanced security mode.'),
};
