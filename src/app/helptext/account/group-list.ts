import { T } from '../../translate-marker';

export default {
group_list_actions_label_member: T("Members"),
group_list_actions_id_member: "members",
group_list_actions_label_edit: T("Edit"),
group_list_actions_id_edit: "edit",
group_list_actions_label_delete: T("Delete"),

builtins_dialog: {
    title: T(' Built-in Groups'),
    message: T(' built-in groups (default setting is <i>hidden</i>).'),
    show: T('Show'),
    hide: T('Hide')
},

builtinMessageDialog: {
    title: T('Display Note'),
    message: T('All built-in groups are \
 hidden by default. Use the gear icon (top-right) to toggle the display of built-in groups.'),
    button: T('Close')
},
globalConfigTooltip: T('Toggle built-in groups'),

deleteDialog: {
    title: T('Delete Group '),
    message: T('Delete Group '),
    saveButtonText: T('DELETE'),
}
}
