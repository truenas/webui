import { T } from '../../../translate-marker';


export default {
    dataset_placeholder: T('Pool/Dataset'),
    dataset_tooltip: T('Select a pool, dataset, or zvol.'),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T('Set this to take separate snapshots of the\
 pool/dataset and each of its child datasets. Leave unset to take a\
 single snapshot of the specified pool/dataset with <b>no</b> child datasets.'),

    exclude_placeholder: T('Exclude'),
    exclude_tooltip: T(''),

    lifetime_value_placeholder: T('Snapshot Lifetime'),

    lifetime_unit_tooltip: T('Define a length of time to retain the snapshot on this\
 system. After the time expires, the snapshot is removed. Snapshots which have\
 been replicated to other systems are not affected.'),

    naming_schema_placeholer: T('Naming Schema'),
    naming_schema_tooltip: T(''),

    begin_placeholder: T('Begin'),
    begin_tooltip: T('Choose the hour and minute when the system can begin\
 taking snapshots.'),

    end_placeholder: T('End'),
    end_tooltip: T('Choose the hour and minute when the system must stop\
 taking snapshots.'),

    snapshot_picker_placeholder: T('Schedule the Periodic Snapshot Task'),
    snapshot_picker_tooltip: T('Choose one of the convenient presets\
 or choose <b>Custom</b> to trigger the advanced scheduler UI'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Unset to disable this task without deleting it.'),
}