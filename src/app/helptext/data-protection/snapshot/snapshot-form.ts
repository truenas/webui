import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSnapshotForm = {
  datasetLabel: T('Dataset'),

  recursiveLabel: T('Recursive'),
  recursiveTooltip: T('Set to take separate snapshots of the \
 dataset and each of its child datasets. Leave unset to take a \
 single snapshot only of the specified dataset <i>without</i> child \
 datasets.'),

  excludeLabel: T('Exclude'),
  excludeTooltip: T('Exclude specific child datasets from the \
 snapshot. Use with recursive snapshots. List paths to any child \
 datasets to exclude. Example: <i>pool1/dataset1/child1</i>. \
 A recursive snapshot of <i>pool1/dataset1</i> will include all child \
 datasets except <i>child1</i>. Separate entries by pressing \
 <code>Enter</code>.'),

  lifetimeLabel: T('Snapshot Lifetime'),
  lifetimeTooltip: T('Define a length of time to retain the snapshot on this system. After the \
  time expires, the snapshot is removed. Snapshots which have been replicated \
  to other systems are not affected.'),

  namingSchemaLabel: T('Naming Schema'),
  namingSchemaTooltip: T('Snapshot name format string. The default \
 is <code>auto-&percnt;Y-&percnt;m-&percnt;d_&percnt;H-&percnt;M</code>. Must include the strings <i>&percnt;Y</i>, \
 <i>&percnt;m</i>, <i>&percnt;d</i>, <i>&percnt;H</i>, and <i>&percnt;M</i>, which are replaced with \
 the four-digit year, month, day of month, hour, and minute as defined \
 in <a href="https://man7.org/linux/man-pages/man3/strftime.3.html" target="_blank">strftime(3)</a>.<br><br> \
 For example, snapshots of <i>pool1</i> with a Naming Schema of \
 <i>customsnap-&percnt;Y&percnt;m&percnt;d.&percnt;H&percnt;M</i> have names like \
 <i>pool1@customsnap-20190315.0527</i>.'),

  beginLabel: T('Begin'),
  beginTooltip: T('Hour and minute when the system can begin \
 taking snapshots.'),

  endLabel: T('End'),
  endTooltip: T('Hour and minute the system must stop \
 creating snapshots. Snapshots already in progress will continue until \
 complete.'),

  scheduleLabel: T('Schedule'),
  scheduleTooltip: T('Choose one of the presets \
 or choose <i>Custom</i> to use the advanced scheduler.'),

  allowEmptyLabel: T('Allow Taking Empty Snapshots'),
  allowEmptyTooltip: T('Creates dataset snapshots even when there \
 have been no changes to the dataset from the last snapshot. Recommended \
 for creating long-term restore points, multiple snapshot tasks pointed \
 at the same datasets, or to be compatible with snapshot schedules or \
 replications created in TrueNAS 11.2 and earlier.<br><br> For example, \
 allowing empty snapshots for a monthly snapshot schedule allows that \
 monthly snapshot to be taken, even when a daily snapshot task has \
 already taken a snapshot of any changes to the dataset.'),

  enabledLabel: T('Enabled'),
};
