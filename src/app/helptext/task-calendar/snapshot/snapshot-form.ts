import { T } from '../../../translate-marker';


export default {
    dataset_placeholder: T('Dataset'),
    dataset_tooltip: T('Select a pool, dataset, or zvol.'),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T('Set to take separate snapshots of the\
 dataset and each of its child datasets. Leave unset to take a\
 single snapshot only of the specified dataset <i>without</i> child datasets.'),

    exclude_placeholder: T('Exclude'),
    exclude_tooltip: T('Exclude specific child datasets from the snapshot.\
 Use with recursive snapshots. Comma-separated list of paths to any child datasets to exclude.\
 Example: <i>pool1/dataset1/child1</i>. A recursive snapshot of\
 <i>pool1/dataset1</i> will include all child datasets except <i>child1</i>.'),

    lifetime_value_placeholder: T('Snapshot Lifetime'),
    lifetime_unit_tooltip: T('Define a length of time to retain the snapshot on this\
 system. After the time expires, the snapshot is removed. Snapshots which have\
 been replicated to other systems are not affected.'),

    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T('Snapshot name format string. The default is <i>snap-%Y-%m-%d-%H-%M</i>.\
 Must include the strings <i>%Y</i>, <i>%m</i>, <i>%d</i>, <i>%H</i>, and <i>%M</i>, which are replaced with the four-digit year,\
 month, day of month, hour, and minute as defined in <a href="https://www.freebsd.org/cgi/man.cgi?query=strftime" target="_blank">strftime(3)</a>. A string showing the snapshot\
 lifetime is appended to the name. For example, snapshots of <i>pool1</i> with a Naming Schema of\
 <i>customsnap-%Y%m%d.%H%M</i> and lifetime of two weeks have names like <i>pool1@customsnap-20190315.0527-2w</i>.'),

    begin_placeholder: T('Begin'),
    begin_tooltip: T('Hour and minute the system can begin\
 taking snapshots.'),

    end_placeholder: T('End'),
    end_tooltip: T('Hour and minute the system must stop\
 creating snapshots. Snapshots already in progress will continue until complete.'),

    snapshot_picker_placeholder: T('Schedule the Periodic Snapshot Task'),
    snapshot_picker_tooltip: T('Choose one of the presets\
 or choose <i>Custom</i> to use the advanced scheduler.'),

    allow_empty_placeholder: T('Allow taking empty snapshots'),
    allow_empty_tooltip: T(''),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Unset to disable this task without deleting it.'),
}
