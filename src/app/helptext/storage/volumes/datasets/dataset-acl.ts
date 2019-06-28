import { T } from '../../../../translate-marker';

export default {
dataset_acl_title_name: T('ACL Manager'),
dataset_acl_path_placeholder: T('Path'),

dataset_acl_aces_placeholder: T('Access Control Entries'),

dataset_acl_tag_placeholder: T('Tag'),
dataset_acl_tag_tooltip: T(''),
dataset_acl_tag_options: [
                           {label:'User', value: 'USER'},
                           {label:'Group', value: 'GROUP'},
                           {label:'owner@', value: 'owner@'},
                           {label:'group@', value: 'group@'},
                           {label:'everyone@', value: 'everyone@'}
                         ],
dataset_acl_type_placeholder: T('ACL Type'),
dataset_acl_type_tooltip: T(''),
dataset_acl_type_options: [
                           {label: 'Allow', value: 'ALLOW'},
                           {label: 'Deny', value: 'DENY'}
                         ],

dataset_acl_perms_type_placeholder: T('Permissions Type'),
dataset_acl_perms_type_tooltip: T(''),
dataset_acl_perms_type_options: [
                            {label:'Basic', value: 'BASIC'},
                            {label:'Advanced', value: 'ADVANCED'}
                          ],
                          
dataset_acl_user_placeholder: T('User'),
dataset_acl_user_tooltip: T('Select the user to control the pool/dataset. Users\
 manually created or imported from a directory service\
 will appear in the drop-down menu.'),
                          
dataset_acl_group_placeholder: T('Group'),
dataset_acl_group_tooltip: T('Select the group to control the pool/dataset. Groups\
 manually created or imported from a directory service\
 will appear in the drop-down menu.'),

dataset_acl_uid_placeholder: T('User'),
dataset_acl_uid_tooltip: T('Select the user to control the pool/dataset. Users\
 manually created or imported from a directory service\
 will appear in the drop-down menu.'),

dataset_acl_gid_placeholder: T('Group'),
dataset_acl_gid_tooltip: T('Select the group to control the pool/dataset. Groups\
 manually created or imported from a directory service\
 will appear in the drop-down menu.'),

dataset_acl_perms_placeholder: T('Permissions'),
dataset_acl_perms_tooltip: T(''),
dataset_acl_basic_perms_options: [
                                  {label:'Read', value: 'READ'},
                                  {label:'Write', value: 'WRITE'},
                                  {label:'Modify', value: 'MODIFY'},
                                  {label:'Traverse', value: 'TRAVERSE'},
                                  {label:'Full Control', value: 'FULL_CONTROL'},
                                  {label:'Other (Too complicated to be displayed)', 
                                   value: 'OTHER', disable: true, hiddenFromDisplay: true}
                                 ],
dataset_acl_basic_perms_other_warning: T('These permissions are too complicated to be displayed and cannot be saved unless changed.'),
dataset_acl_advanced_perms_options: [
                                     {label:'Read Data', value:'READ_DATA'},
                                     {label:'Write Data', value:'WRITE_DATA'},
                                     {label:'Append Data', value:'APPEND_DATA'},
                                     {label:'Read Named Attributes', value:'READ_NAMED_ATTRS'},
                                     {label:'Write Named Attributes', value:'WRITE_NAMED_ATTRS'},
                                     {label:'Execute', value:'EXECUTE'},
                                     {label:'Delete Children', value:'DELETE_CHILD'},
                                     {label:'Read Attributes', value:'READ_ATTRIBUTES'},
                                     {label:'Write Attributes', value:'WRITE_ATTRIBUTES'},
                                     {label:'Delete', value:'DELETE'},
                                     {label:'Read ACL', value:'READ_ACL'},
                                     {label:'Write ACL', value:'WRITE_ACL'},
                                     {label:'Write Owner', value:'WRITE_OWNER'},
                                     {label:'Synchronize', value:'SYNCHRONIZE'},
                                    ],

dataset_acl_flags_type_placeholder: T('Flags Type'),
dataset_acl_flags_type_tooltip: T(''),
dataset_acl_flags_type_options: [
                                  {label:'Basic', value: 'BASIC'},
                                  {label:'Advanced', value: 'ADVANCED'}
                                ],

dataset_acl_flags_placeholder: T('Flags'),
dataset_acl_flags_tooltip: T(''),
dataset_acl_basic_flags_options: [{label: 'Inherit', value: 'INHERIT'},
                                  {label: 'No Inherit', value: 'NOINHERIT'},
                                  {label: 'Other (Too complicated to be displayed)',
                                   value: 'OTHER', disable:true, hiddenFromDisplay: true}
                                 ],
dataset_acl_advanced_flags_options: [
                                     {label:'File Inherit', value:'FILE_INHERIT'},
                                     {label:'Directory Inherit', value:'DIRECTORY_INHERIT'},
                                     {label:'No Propagate Inherit', value:'NO_PROPAGATE_INHERIT'},
                                     {label:'Inherit Only', value:'INHERIT_ONLY'},
                                     {label:'Inherited', value:'INHERITED'},
                                    ],

dataset_acl_recursive_placeholder: T('Apply permissions recursively'),
dataset_acl_recursive_tooltip: T('Apply permissions recursively to all directories\
 and files within the current dataset'),

dataset_acl_traverse_placeholder: T('Apply permissions to child datasets'),
dataset_acl_traverse_tooltip: T('Apply permissions recursively all child datasets\
 within the current dataset'),

dataset_acl_dialog_warning: T('Warning'),
dataset_acl_dialog_warning_message: T('Changing dataset permission mode can severely\
 affect existing permissions.'),
dataset_acl_recursive_dialog_warning: T('Warning'),
dataset_acl_recursive_dialog_warning_message: T("Setting permissions recursively will\
 affect this directory and any others below it. This might make data inaccessible."),
dataset_acl_stripacl_placeholder: T('Strip ACLs'),
dataset_acl_stripacl_tooltip: T("Setting this will strip ACLs from the current dataset.\
 ACLs will also be stripped recursively to directories and child datasets if paired with\
  hose options"),

dataset_acl_stripacl_dialog_warning: T('Warning'),
dataset_acl_stripacl_dialog_warning_message: T('Stripping ACLs will reset the permissions\
 of this dataset. This may make data inaccessible.')
}