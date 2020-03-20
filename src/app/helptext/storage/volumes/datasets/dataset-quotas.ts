import { T } from '../../../../translate-marker';
import globalHelptext from 'app/helptext/global-helptext';

export default {
    users: {
        title: T('Dataset Users'),
        action_label: T('Define Quotas for Selected Users'),
        dialog: {
          title: T('Define quotas for selected users'),
          list: {
            placeholder: T('Selected Users'),
            tooltip: T('This list can be edited in the table. A quota change \
 applies to all users in this list.')
          },
          data_quota: {
            placeholder: T('User Data Quota ') + globalHelptext.human_readable.suggestion_label,
            tooltip: T('Amount of disk space that can be used by the selected users. \
 Enter 0 (zero) to remove the quota.') + globalHelptext.human_readable.suggestion_tooltip
          },
          obj_quota: {
            placeholder: T('User Object Quota'),
            tooltip: T('Number of objects that can be owned by each of the selected users. \
Entering <code>0</code> (zero) removes the quota.'),
          }
        },
        filter_dialog: {
          title_show: T('Show All Users'),
          message_show: T('Show all available users, even those that have not used any data. \
 This is useful for setting quotas for users.'),
          button_show: T('Show'),

          title_filter: T('Filter Users'),
          message_filter: T('Show only those users who are using data. This is the default view \
 and is useful for monitoring data use.'),
          button_filter: T('Filter'),
        },
        table_helptext_title: T('Instructions'),
        table_helptext: T('This table is used to display data consumption by dataset users, and as the interface \
 by which quotas can be set. The default view shows only those users who have consumed data. If the table is \
 empty, it is because there are no users, or that any existing users have not used any data. <br /><br /> \
 Use the settings icon (gear) at the right to view all users. Use the fiter field to find specific users. Click \
 on column headings to sort users. Use the checkboxes on each row to select one or more users to edit. Then open the \
 edit form by clicking the Add button.')
      },

    groups: {
      title: T('Dataset Groups'),
      action_label: T('Define Quotas for Selected Groups'),
      dialog: {
        title: T('Define quotas for selected groups'),
        list: {
          placeholder: T('Selected Groups'),
          tooltip: T('This list can be edited in the table. A quota change \
applies to all groups in this list.')
        },
        data_quota: {
          placeholder: T('Group Data Quota ') + globalHelptext.human_readable.suggestion_label,
          tooltip: T('Amount of disk space that can be consumed by the selected groups. \
Entering <code>0</code> (zero) removes the quota.') + globalHelptext.human_readable.suggestion_tooltip
        },
        obj_quota: {
          placeholder: T('Group Object Quota'),
          tooltip: T('Number of objects that can be owned by each of the selected groups. \
Entering <code>0</code> (zero) removes the quota.'),
        }
      },
        filter_dialog: {
          title_show: T('Show All Groups'),
          message_show: T('Show all available groups, even those that have not used any data. \
 This is useful for setting quotas for groups.'),
          button_show: T('Show'),

          title_filter: T('Filter Groups'),
          message_filter: T('Show only those groups who are using data. This is the default view \
 and is useful for monitoring data use.'),
          button_filter: T('Filter'),
        },
        table_helptext_title: T('Instructions'),
        table_helptext: T('This table is used to display data consumption by dataset groups, and as the interface \
 by which quotas can be set. The default view shows only those groups which have consumed data. If the table is \
 empty, it is because there are no groups, or that any existing groups have not used any data. <br /><br /> \
 Use the settings icon (gear) at the right to view all groups. Use the fiter field to find specific groups. Click \
 on column headings to sort groups. Use the checkboxes on each row to select one or more groups to edit. Then open the \
 edit form by clicking the Add button.')
      },

    shared: {
        input_error: globalHelptext.human_readable.input_error,
        set: T('Set Quota'),
        cancel: T('Cancel')
    }
  }
