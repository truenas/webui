import { T } from '../../../translate-marker';


export default {
    dataset_placeholder: T('Pool/Dataset'),
    dataset_tooltip: T('Select a pool, dataset, or zvol.'),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T('Set to take separate snapshots of the\
 pool/dataset and each of its child datasets. Leave unset to take a\
 single snapshot of the specified pool/dataset with <b>no</b> child datasets.'),

    exclude_placeholder: T('Exclude'),
    exclude_tooltip: T('Exclude specific child datasets from the snapshot.\
 Use with recursive snapshots. List paths to any child datasets to exclude.\
 Example: pool1/dataset1/child1. The pool1/dataset1 recursive snapshot will\
 include all child datasets except child1.'),

    lifetime_value_placeholder: T('Snapshot Lifetime'),
    lifetime_unit_tooltip: T('Define a length of time to retain the snapshot on this\
 system. After the time expires, the snapshot is removed. Snapshots which have\
 been replicated to other systems are not affected.'),

    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T('Snapshot name format string. The default is snap-%Y-%m-%d-%H-%M.\
 Must include the strings %Y, %m, %d, %H, and %M, which are replaced with the four-digit year,\
 month, day of month, hour, and minute as defined in strftime(3). A string showing the snapshot\
 lifetime is appended to the name. For example, snapshots of pool1 with a Naming Schema of\
 "customsnap-%Y%m%d.%H%M" and lifetime of two weeks have names like pool1@customsnap-20190315.0527-2w.'),

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