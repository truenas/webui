import { T } from '../../../../translate-marker';

export default {
dataset_permissions_mp_path_placeholder: T('Path'),

dataset_permissions_mp_acl_placeholder: T('ACL Type'),
dataset_permissions_mp_acl_tooltip: T('Select the type that matches the type of client\
 accessing the pool/dataset.'),

dataset_permissions_mp_user_en_placeholder: T('Apply User'),
dataset_permissions_mp_user_en_tooltip: T('Set to apply changes to the user.'),

dataset_permissions_mp_user_placeholder: T('User'),
dataset_permissions_mp_user_tooltip: T('Select the user to control the pool/dataset. Users\
 manually created or imported from a directory service\
 will appear in the drop-down menu.'),

dataset_permissions_mp_group_en_placeholder: T('Apply Group'),
dataset_permissions_mp_group_en_tooltip: T('Set to apply changes to the group'),

dataset_permissions_mp_group_placeholder: T('Group'),
dataset_permissions_mp_group_tooltip: T('Select the group to control the pool/dataset. Groups\
 manually created or imported from a directory service\
 will appear in the drop-down menu.'),

dataset_permissions_mp_mode_en_placeholder: T('Apply Mode'),
dataset_permissions_mp_mode_en_tooltip: T('Set to apply changes to the mode'),

dataset_permissions_mp_mode_placeholder: T('Access Mode'),
dataset_permissions_mp_mode_tooltip: T('Set the read, write and execute permissions for the dataset.'),

dataset_permissions_mp_recursive_placeholder: T('Apply permissions recursively'),
dataset_permissions_mp_recursive_tooltip: T('Apply permissions recursively to all directories\
 and files within the current dataset'),

dataset_permissions_dialog_warning: T('Warning'),
dataset_permissions_dialog_warning_message: T('Changing dataset permission mode can severely\
 affect existing permissions, particularly when going from Windows to Unix permissions.'),

heading_dataset_path: T('Dataset Path'),
heading_who: T('Who'),
heading_access: T('Access'),
heading_advanced: T('Advanced')
}