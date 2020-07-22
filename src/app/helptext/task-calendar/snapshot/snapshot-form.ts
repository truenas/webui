import { T } from '../../../translate-marker';


export default {
    fieldset_dataset: T('Dataset'),
    fieldset_schedule: T('Schedule'),

    dataset_placeholder: T('Dataset'),
    dataset_tooltip: T('Select a pool, dataset, or zvol.'),
    dataset_warning: T('Invalid dataset.'),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T('Set to take separate snapshots of the \
 dataset and each of its child datasets. Leave unset to take a \
 single snapshot only of the specified dataset <i>without</i> child \
 datasets.'),

    exclude_placeholder: T('Exclude'),
    exclude_tooltip: T('Exclude specific child datasets from the \
 snapshot. Use with recursive snapshots. List paths to any child \
 datasets to exclude. Example: <i>pool1/dataset1/child1</i>. \
 A recursive snapshot of <i>pool1/dataset1</i> will include all child \
 datasets except <i>child1</i>. Separate entries by pressing \
 <code>Enter</code>.'),

    lifetime_placeholder: T('Snapshot Lifetime'),
    lifetime_tooltip: T('Define a length of time to retain the snapshot \
 on this system using a numeric value and a single lowercase letter for \
 units. Examples: <i>3h</i> is three hours, <i>1m</i> is one month, and \
 <i>1y</i> is one year. Does not accept Minute values. After the time \
 expires, the snapshot is removed. Snapshots which have been replicated \
 to other systems are not affected.'),


    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T('Snapshot name format string. The default \
 is <code>auto-\%Y-\%m-\%d_\%H-\%M</code>. Must include the strings <i>\%Y</i>, \
 <i>\%m</i>, <i>\%d</i>, <i>\%H</i>, and <i>\%M</i>, which are replaced with \
 the four-digit year, month, day of month, hour, and minute as defined \
 in <a href="https://www.freebsd.org/cgi/man.cgi?query=strftime" target="_blank">strftime(3)</a>.<br><br> \
 For example, snapshots of <i>pool1</i> with a Naming Schema of \
 <i>customsnap-\%Y\%m\%d.\%H\%M</i> have names like \
 <i>pool1@customsnap-20190315.0527</i>.'),

    begin_placeholder: T('Begin'),
    begin_tooltip: T('Hour and minute when the system can begin \
 taking snapshots.'),

    end_placeholder: T('End'),
    end_tooltip: T('Hour and minute the system must stop \
 creating snapshots. Snapshots already in progress will continue until \
 complete.'),

    snapshot_picker_placeholder: T('Schedule'),
    snapshot_picker_tooltip: T('Choose one of the presets \
 or choose <i>Custom</i> to use the advanced scheduler.'),

    allow_empty_placeholder: T('Allow Taking Empty Snapshots'),
    allow_empty_tooltip: T('Creates dataset snapshots even when there \
 have been no changes to the dataset from the last snapshot. Recommended \
 for creating long-term restore points, multiple snapshot tasks pointed \
 at the same datasets, or to be compatible with snapshot schedules or \
 replications created in TrueNAS 11.2 and earlier.<br><br> For example, \
 allowing empty snapshots for a monthly snapshot schedule allows that \
 monthly snapshot to be taken, even when a daily snapshot task has \
 already taken a snapshot of any changes to the dataset.'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('To activate this periodic snapshot schedule, set \
 this option. To disable this task without deleting it, unset this \
 option.'),
}
