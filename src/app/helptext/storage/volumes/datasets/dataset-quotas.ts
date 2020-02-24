import { T } from '../../../../translate-marker';
import globalHelptext from 'app/helptext/global-helptext';

export default {
    users: {
        heading: T('Quotas for Users'),
        placeholder: T('Users'),
        tooltip: T('Select one or more users to whom these quotas will be applied.'),
        data_placeholder: T('User Data Quota ') + globalHelptext.human_readable.suggestion_label,
        data_tooltip: T('Enter the amount of disk space that may be consumed by the selected users. ') + 
            globalHelptext.human_readable.suggestion_tooltip + T(' ???'),
        obj_placeholder: T('User Object Quota'),
        obj_tooltip: T('Enter a number of objects which may be owned by each of the selected users.'),
    },

    groups: {
        heading: T('Quotas for Groups'),
        placeholder: T('Groups'),
        tooltip: T('Select one or more groups to which these quotas will be applied.'),
        data_placeholder: T('Group Data Quota ') + globalHelptext.human_readable.suggestion_label,
        data_tooltip: T('Enter the amount of disk space that may be consumed by the selected groups. ') + 
            globalHelptext.human_readable.suggestion_tooltip + T(' ???'),
        obj_placeholder: T('Group Object Quota'),
        obj_tooltip: T('Enter a number of objects which may be owned by each of the selected groups.'),
    }

}