import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextQuotas = {
  fieldAcceptsTooltip: T('This field accepts human-readable input (Ex. 50 GiB, 500M, 2 TB).'),
  users: {
    title: T('Show All Users'),
    tooltip: T('You can search both for local users as well as users from Active Directory.\
Press ENTER to separate entries.'),
    dataQuota: {
      placeholder: T('User Data Quota '),
      tooltip: T('Amount of disk space that can be used by the selected users. \
 Entering <code>0</code> (zero) allows all disk space to be used.'),
    },
    objQuota: {
      placeholder: T('User Object Quota'),
      tooltip: T('Number of objects that can be owned by each of the selected users. \
 Entering <code>0</code> (zero) allows unlimited objects.'),
    },
    filterDialog: {
      showTitle: T('Show All Users'),
      showMessage: T('Show all available users, including those that do not have quotas set.'),
      showButton: T('Show'),

      filterTitle: T('Filter Users'),
      filterMessage: T('Show only those users who have quotas. This is the default view.'),
      filterButton: T('Filter'),
    },
    nameLabel: T('User'),
    removeInvalidQuotas: {
      message: T('This action will set all dataset quotas for the removed or invalid users to 0,\
 virtually removing any dataset quota entires for such users. Are you sure you want to proceed?'),
    },
    deleteDialog: {
      title: T('Delete User Quota'),
      message: T('Are you sure you want to delete the user quota <b>{name}</b>?'),
    },
  },

  groups: {
    title: T('Show All Groups'),
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
    filterDialog: {
      showTitle: T('Show All Groups'),
      showMessage: T('Show all available groups, including those that do not have quotas set.'),
      showButton: T('Show'),

      filterTitle: T('Filter Groups'),
      filterMessage: T('Shows only the groups that have quotas. This is the default view.'),
      filterButton: T('Filter'),
    },
    nameLabel: T('Group'),
    removeInvalidQuotas: {
      message: T('This action will set all dataset quotas for the removed or invalid groups to 0,\
 virtually removing any dataset quota entries for such groups. Are you sure you want to proceed?'),
    },
    deleteDialog: {
      title: T('Delete Group Quota'),
      message: T('Are you sure you want to delete the group quota <b>{name}</b>?'),
    },
  },
};
