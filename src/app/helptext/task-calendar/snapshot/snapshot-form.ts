import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
    task_filesystem_placeholder: T('Pool/Dataset'),
    task_filesystem_tooltip: T('Select a pool, dataset, or zvol.'),
    task_filesystem_validation : [ Validators.required ],

    task_recursive_placeholder: T('Recursive'),
    task_recursive_tooltip: T('Set this to take separate snapshots of the\
                pool/dataset and each of its child datasets. Leave\
                unset to take a single snapshot of the specified\
                pool/dataset with <b>no</b> child datasets.'),

    task_ret_count_placeholder: T('Snapshot Lifetime'),
    task_ret_count_validation: [Validators.min(0)],

    task_ret_unit_tooltip: T('Define a length of time to retain the snapshot on this\
                system. After the time expires, the snapshot is removed.\
                Snapshots which have been replicated to other systems\
                are not affected.'),

                type: 'select',
    name: 'task_begin',
    task_begin_placeholder: T('Begin'),
    task_begin_tooltip: T('Choose the hour and minute when the system can begin\
                taking snapshots.'),
    options: [],
    value: '',
    required: true,
    task_begin_validation : [ Validators.required ],

    task_end_placeholder: T('End'),
    task_end_tooltip: T('Choose the hour and minute when the system must stop\
                taking snapshots.'),
    task_end_validation : [ Validators.required ],

    task_interval_placeholder: T('Interval'),
    task_interval_tooltip: T('Define how often the system takes snapshots between the\
                <b>Begin</b> and <b>End</b> times.'),
    task_interval_validation : [ Validators.required ],

    task_byweekday_placeholder: T('Day of week'),
    task_byweekday_tooltip: T('Choose the days of the week to take snapshots.'),
    task_byweekday_validation : [ Validators.required ],

    task_enabled_placeholder: T('Enabled'),
    task_enabled_tooltip: T('Unset to disable this task without deleting it.'),
}