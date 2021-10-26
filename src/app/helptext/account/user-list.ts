import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  user_list_actions_edit_label: T('Edit'),
  user_list_actions_edit_id: 'edit',
  user_list_actions_delete_label: T('Delete'),

  builtinMessageDialog: {
    title: T('Display Note'),
    message: T('All built-in users except <i>root</i> are \
 hidden by default. Use the gear icon (top-right) to toggle the display of built-in users.'),
    button: T('Close'),
  },
  globalConfigTooltip: T('Toggle built-in users'),

  deleteDialog: {
    title: T('Delete User '),
    deleteGroup_placeholder: T('Delete user primary group '),
    message: T('Delete User '),
    saveButtonText: T('Delete'),
  },
};
