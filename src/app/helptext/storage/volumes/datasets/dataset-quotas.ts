import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helpTextQuotas = {
  field_accepts_tooltip: T('This field accepts human-readable input (Ex. 50 GiB, 500M, 2 TB).'),
  users: {
    title: 'Show All Users',
    tooltip: T('You can search both for local users as well as users from Active Directory.\
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
      placeholder: T('User'),
    },
    remove_invalid_quotas: {
      message: T('This action will set all dataset quotas for the removed or invalid users to 0,\
 virtually removing any dataset quota entires for such users. Are you sure you want to proceed?'),
    },
    delete_dialog: {
      title: T('Delete User Quota'),
      message: T('Are you sure you want to delete the user quota <b>{name}</b>?'),
    },
  },

  groups: {
    title: 'Show All Groups',
    tooltip: T('You can search both for local groups as well as groups from Active Directory.\
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
      placeholder: T('Group'),
    },
    remove_invalid_quotas: {
      message: T('This action will set all dataset quotas for the removed or invalid groups to 0,\
 virtually removing any dataset quota entires for such groups. Are you sure you want to proceed?'),
    },
    delete_dialog: {
      title: T('Delete Group Quota'),
      message: T('Are you sure you want to delete the group quota <b>{name}</b>?'),
    },
  },

  shared: {
    nameErr: T('Name not found'),
  },
};
