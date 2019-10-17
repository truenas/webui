import { T } from '../../translate-marker';
import {Validators} from '@angular/forms';
import { matchOtherValidator } from '../../pages/common/entity/entity-form/validators/password-validation';
import { UserService } from 'app/services';

export default {
user_form_title_name: T('Name & Contact'),
user_form_title_class:'name-and-contact',
user_form_full_name_name: 'full_name',
user_form_full_name_placeholder : T('Full Name'),
user_form_full_name_tooltip : T('Spaces are allowed.'),
user_form_full_name_validation : [ Validators.required ],
user_form_username_name: 'username',
user_form_username_placeholder : T('Username'),
user_form_username_tooltip : T('Usernames can be up to 16 characters long.\
 When using NIS or other legacy software with limited username lengths,\
 keep usernames to eight characters or less for compatibility.\
 Usernames cannot begin with a hyphen (<i>-</i>) or contain a space,\
 tab, or these characters:\
 <i>, : + & # % ^ ( ) ! @ ~ * ? < > =</i>. <i>$</i> can only be\
 used as the last character of the username.'),

user_form_email_name:'email',
user_form_email_placeholder : T('Email'),
user_form_email_tooltip : T('Enter the email address of the new user.'),
user_form_password_name: 'password',
user_form_password_placeholder : T('Password'),
user_form_password_tooltip : T('Required unless <b>Enable password login</b> is\
 <i>No</i>. Passwords cannot contain a <b>?</b>.'),
user_form_password_validation : [ Validators.pattern('^[^?]*$'), Validators.required ],
user_form_password_confirm_name : 'password_conf',
user_form_password_confirm_placeholder : T('Confirm Password'),
user_form_password_confirm_validation : [ matchOtherValidator('password'), Validators.pattern('^[^?]*$'), Validators.required ],
user_form_password_edit_name: 'password_edit',
user_form_password_edit_placeholder : T('Password'),
user_form_password_edit_tooltip : T('Required unless <b>Enable password login</b> is\
 <i>No</i>. Passwords cannot contain a <b>?</b>.'),
user_form_password_edit_validation : [ Validators.pattern('^[^?]*$') ],
user_form_password_edit_confirm_name: 'password_conf_edit',
user_form_password_edit_confirm_placeholder : T('Confirm Password'),
user_form_password_edit_confirm_validation : [ matchOtherValidator('password_edit'), Validators.pattern('^[^?]*$') ],

user_form_ids_groups_title: T('ID & Groups'),
user_form_ids_groups_title_class: 'id-and-groups',
user_form_uid_name: 'uid',
user_form_uid_placeholder : T('User ID'),
user_form_uid_tooltip : T('User accounts have an ID greater than 1000 and\
 system accounts have an ID equal to the default\
 port number used by the service.'),
user_form_uid_validation : [ Validators.required ],
user_form_group_create_name: 'group_create',
user_form_group_create_placeholder : T('New Primary Group'),
user_form_group_create_tooltip : T('Set to create a new primary group with the same name as\
 the user. Unset to select an existing group for the user.'),
user_form_primary_group_name: 'group',
user_form_primary_group_placeholder : T('Primary Group'),
user_form_primary_group_tooltip : T('New users are not given <b>su</b> permissions if\
 <i>wheel</i> is their primary group.'),
user_form_aux_groups_name : 'groups',
user_form_aux_groups_placeholder : T('Auxiliary Groups'),
user_form_aux_groups_tooltip : T('Add this user to additional groups.'),

user_form_dirs_title_name: T('Directories & Permissions'),
user_form_dirs_title_class:'directories-and-permissions',
user_form_dirs_explorer_name: 'home',
user_form_dirs_explorer_class: 'meExplorer',
user_form_dirs_explorer_placeholder: T('Home Directory'),
user_form_dirs_explorer_value: '/nonexistent',
user_form_dirs_explorer_tooltip : T('Choose a path to the user\'s\
 home directory. If the directory exists and matches the username,\
 it is set as the user\'s home directory. When the path does not\
 end with a subdirectory matching the username, a new subdirectory is\
 created. The full path to the user\'s home directory is shown\
 here when editing a user.'),
user_form_home_dir_permissions_name: 'home_mode',
user_form_home_dir_permissions_placeholder : T('Home Directory Permissions'),
user_form_home_dir_permissions_tooltip : T('Sets default Unix permissions of the user home\
 directory. This is read-only for built-in users.'),

user_form_auth_title_name: 'Authentication',
user_form_auth_title_class:'authentication',
user_form_auth_sshkey_name : 'sshpubkey',
user_form_auth_sshkey_placeholder : T('SSH Public Key'),
user_form_auth_sshkey_tooltip : T('Enter or paste the <b>public</b> SSH key of the\
 user for any key-based authentication. <b>Do not paste the private key.</b>'),
user_form_auth_pw_enable_name: 'password_disabled',
user_form_auth_pw_enable_placeholder : T('Enable password login'),
user_form_auth_pw_enable_tooltip : T('Enable password logins and authentication to SMB\
 shares. Selecting <b>No</b> removes the <b>Lock\
 User</b> and <b>Permit Sudo</b> options.'),
user_form_auth_pw_enable_label_yes: T('Yes'),
user_form_auth_pw_enable_label_no: T('No'),
user_form_shell_name : 'shell',
user_form_shell_placeholder : T('Shell'),
user_form_shell_tooltip : T('Select the shell to use for local and SSH logins.'),
user_form_lockuser_name : 'locked',
user_form_lockuser_placeholder : T('Lock User'),
user_form_lockuser_tooltip : T('Set to disable logging in to this user account.'),
user_form_sudo_name: 'sudo',
user_form_sudo_placeholder : T('Permit Sudo'),
user_form_sudo_tooltip : T('Give this user permission to use <a\
 href="https://www.sudo.ws/" target="_blank">sudo</a>.'),
user_form_microsoft_name : 'microsoft_account',
user_form_microsoft_placeholder : T('Microsoft Account'),
user_form_microsoft_tooltip : T('Set to allow additional username authentication\
 methods when the user is connecting from a Windows 8 or newer operating system.'),
user_form_blur_event2_warning: T('Usernames can be up to 16 characters long.\
 When using NIS or other legacy software with limited username lengths,\
 keep usernames to eight characters or less for compatibility.')
}
