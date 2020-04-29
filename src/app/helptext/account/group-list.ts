import { T } from '../../translate-marker';

export default {
group_list_actions_label_member: T("Members"),
group_list_actions_id_member: "members",
group_list_actions_label_edit: T("Edit"),
group_list_actions_id_edit: "edit",
group_list_actions_label_delete: T("Delete"),
group_list_dialog_label: T("Delete"), 
group_list_dialog_message: T('Delete all users with this primary group?'),

builtins_dialog: {
    title: T(' Builtin Groups'),
    message: T(' builtin groups (default setting is <i>hidden</i>).'),
    show: T('Show'),
    hide: T('Hide')
},

builtinMessageDialog: {
    title: T('Display Note'),
    message: T('All builtin groups are \
 hidden by default. Use the gear icon (top-right) to toggle the display of builtin groups.'),
    button: T('Close')
},
globalConfigTooltip: T('Toggle builtin groups')

}