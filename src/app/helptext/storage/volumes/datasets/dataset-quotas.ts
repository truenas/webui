import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import globalHelptext from 'app/helptext/global-helptext';

export default {
  field_accepts_tooltip: T('This field accepts human-readable input (Ex. 50 GiB, 500M, 2 TB).'),
  users: {
    table_title: T('User Quotas'),
    quota_title: T('Set Quotas'),
    user_title: T('Apply Quotas to Selected Users'),
    system_select: {
      placeholder: T('Select Users Cached by this System'),
      tooltip: T('The list only shows users cached on this system. The search box \
  below can locate all users, including users connected with Active Directory or other services.'),
    },
    search: {
      placeholder: T('Search For Connected Users'),
      tooltip: T('Search for all connected users. \
 Type a user name and press <i>ENTER</i>. A warning is shown \
 if there are no matches.'),
    },
    data_quota: {
      placeholder: T('User Data Quota '),
      tooltip: T('Amount of disk space that can be used by the selected users. \
 Entering <code>0</code> (zero) allows all disk space to be used.'),
    },
    obj_quota: {
      placeholder: T('User Object Quota'),
      tooltip: T('Number of objects that can be owned by each of the selected users. \
 Entering <code>0</code> (zero) allows unlimited objects.'),
    },
    filter_dialog: {
      title_show: T('Show All Users'),
      message_show: T('Show all available users, including those that do not have quotas set.'),
      button_show: T('Show'),

      title_filter: T('Filter Users'),
      message_filter: T('Show only those users who have quotas. This is the default view.'),
      button_filter: T('Filter'),
    },
    dialog: {
      title: T('Edit User'),
      user: {
        placeholder: T('User'),
      },
    },
  },

  groups: {
    table_title: T('Group Quotas'),
    quota_title: T('Set Quotas'),
    group_title: T('Apply Quotas to Selected Groups'),
    system_select: {
      placeholder: T('Select Groups Cached by this System'),
      tooltip: T('The list shows only groups cached on this system. The search box \
  below can locate all groups, including groups connected with Active Directory or other services.'),
    },
    search: {
      placeholder: T('Search For Connected Groups'),
      tooltip: T('Search for all connected groups. \
 Type a group name and press <i>ENTER</i>. A warning is shown \
 if there are no matches.'),
    },
    data_quota: {
      placeholder: T('Group Data Quota '),
      tooltip: T('Amount of disk space that can be used by the selected groups. \
 Entering <code>0</code> (zero) allows all disk space.'),
    },
    obj_quota: {
      placeholder: T('Group Object Quota'),
      tooltip: T('Number of objects that can be owned by each of the selected groups. \
 Entering <code>0</code> (zero) allows unlimited objects.'),
    },
    filter_dialog: {
      title_show: T('Show All Groups'),
      message_show: T('Show all available groups, including those that do not have quotas set.'),
      button_show: T('Show'),

      title_filter: T('Filter Groups'),
      message_filter: T('Shows only the groups that have quotas. This is the default view.'),
      button_filter: T('Filter'),
    },
    dialog: {
      title: T('Edit Group'),
      group: {
        placeholder: T('Group'),
      },
    },
  },

  shared: {
    input_error: globalHelptext.human_readable.input_error,
    set: T('Set Quota'),
    cancel: T('Cancel'),
    nameErr: T('Name not found'),
  },
};
