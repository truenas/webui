import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import globalHelptext from 'app/helptext/global-helptext';

export default {
  field_accepts_tooltip: T('This field accepts human-readable input (Ex. 50 GiB, 500M, 2 TB).'),
  users: {
    quota_title: T('Set Quotas'),
    user_title: T('Apply Quotas to Selected Users'),
    usersTooltip: T('You can search both for local users as well as users from Active Directory.\
Press ENTER to separate entries.'),
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
    quota_title: T('Set Quotas'),
    group_title: T('Apply Quotas to Selected Groups'),
    groupsTooltip: T('You can search both for local groups as well as groups from Active Directory.\
Press ENTER to separate entries.'),
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
