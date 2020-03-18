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
 will apply to all users in this list.')
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

        }
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

      }
    },

    shared: {
        input_error: globalHelptext.human_readable.input_error,
        set: T('Set Quota'),
        cancel: T('Cancel')
    }
  }
