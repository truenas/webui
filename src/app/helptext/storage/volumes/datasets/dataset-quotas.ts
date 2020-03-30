import { T } from '../../../../translate-marker';
import globalHelptext from 'app/helptext/global-helptext';

export default {
  users: {
    table_title: T('User Quotas'),
    quota_title: T('Set Quotas'),
    user_title: T('Apply Quotas to Selected Users'),
    system_select: {
      placeholder: T('Select Users Cached by this System'),
      tooltip: T('This list includes only users cached on this system. The search box \
  (below) can be used to locate all users, including users connected via Active Directory, etc.')
    },
    search: {
      placeholder: T('Search For Connected Users'),
      tooltip: T('Search for all connected users). \
 Type a user name followed by <i>ENTER</i>. A warning will be displayed \
 if the name does not match a valid user.')
            },
    data_quota: {
      placeholder: T('User Data Quota ') + globalHelptext.human_readable.suggestion_label,
      tooltip: T('Amount of disk space that can be used by the selected users. \
 Enter 0 (zero) to remove the quota (i.e., to set it to <i>unlimited</i>).') + globalHelptext.human_readable.suggestion_tooltip
    },
    obj_quota: {
      placeholder: T('User Object Quota'),
      tooltip: T('Number of objects that can be owned by each of the selected users. \
 Entering <code>0</code> (zero) removes the quota (i.e., to set it to <i>unlimited</i>).'),
    },
    filter_dialog: {
      title_show: T('Show All Users'),
      message_show: T('Show all available users, even those that have not used any data.'),
      button_show: T('Show'),

      title_filter: T('Filter Users'),
      message_filter: T('Show only those users who are using data. This is the default view.'),
      button_filter: T('Filter'),
    },
    dialog: {
      title: T('Edit User'),
      user: {
        placeholder: T('User'),
      }
    }
  },

  groups: {
    table_title: T('Group Quotas'),
    quota_title: T('Set Quotas'),
    group_title: T('Apply Quotas to Selected Groups'),
    system_select: {
      placeholder: T('Select Groups Cached by this System'),
      tooltip: T('This list includes only groups cached on this system. The search box \
  (below) can be used to locate all groups, including groups connected via Active Directory, etc.')
    },
    search: {
      placeholder: T('Search For Connected Groups'),
      tooltip: T('Search for all connected groups). \
 Type a group name followed by <i>ENTER</i>. A warning will be displayed \
 if the name does not match a valid group.')
            },
    data_quota: {
      placeholder: T('Group Data Quota ') + globalHelptext.human_readable.suggestion_label,
      tooltip: T('Amount of disk space that can be used by the selected groups. \
 Enter 0 (zero) to remove the quota (i.e., to set it to <i>unlimited</i>).') + globalHelptext.human_readable.suggestion_tooltip
    },
    obj_quota: {
      placeholder: T('Group Object Quota'),
      tooltip: T('Number of objects that can be owned by each of the selected groups. \
 Entering <code>0</code> (zero) removes the quota (i.e., to set it to <i>unlimited</i>).'),
    },
    filter_dialog: {
      title_show: T('Show All Groups'),
      message_show: T('Show all available groups, even those that have not used any data.'),
      button_show: T('Show'),

      title_filter: T('Filter Groups'),
      message_filter: T('Shows only the groups that are using data. This is the default view.'),
      button_filter: T('Filter'),
    },
    dialog: {
      title: T('Edit Group'),
      group: {
        placeholder: T('Group'),
      }
    }
  },

  shared: {
      input_error: globalHelptext.human_readable.input_error,
      set: T('Set Quota'),
      cancel: T('Cancel')
  }
  }
